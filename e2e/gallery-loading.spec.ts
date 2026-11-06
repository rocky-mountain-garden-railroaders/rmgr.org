import { test, expect } from '@playwright/test'

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test.describe(`gallery downloads at ${viewport.width}px`, () => {
    test.use({ viewport, reducedMotion: 'reduce' })

    test('requests only covers until selection, then only the displayed photo', async ({ page }) => {
      const requestedImages = new Set<string>()
      page.on('request', (request) => {
        if (request.resourceType() === 'image') requestedImages.add(request.url())
      })

      await page.goto('/gallery?galleryDebug=true')
      const covers = page.locator('.gallery-section')
      const coverImages = covers.locator('img[src]')
      const viewer = page.locator('.modal-image-shell')
      await expect(coverImages.first()).toBeVisible()

      // Quiescence is intentional here: the assertion covers background downloads too.
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle')
      const initialCoverCount = await coverImages.count()
      expect(initialCoverCount).toBeGreaterThan(0)
      expect(initialCoverCount).toBeLessThan(await covers.count())
      await expect(viewer).toHaveCount(0)

      // Scroll the entire chooser so every allowed cover can load, but no other photos can.
      for (const cover of await covers.all()) {
        await cover.scrollIntoViewIfNeeded()
        await expect(cover.locator('img[src]')).toBeVisible()
      }
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle')
      const coverSources = await coverImages.evaluateAll((images) =>
        images.map((image) => (image as HTMLImageElement).src),
      )
      expect(coverSources.every((src) => !src.startsWith('data:'))).toBe(true)
      // The site logo is outside the chooser and is not a gallery photo.
      const logoSources = await page.locator('header img[src]').evaluateAll((images) =>
        images.map((image) => (image as HTMLImageElement).src),
      )
      const allowedImages = new Set([...coverSources, ...logoSources])
      expect([...requestedImages].filter((src) => !allowedImages.has(src))).toEqual([])

      const selectedGallery = covers.first().getByRole('button')
      await selectedGallery.scrollIntoViewIfNeeded()
      await selectedGallery.focus()
      await page.keyboard.press('Enter')
      await expect(viewer.locator('img')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Play slideshow', exact: true })).toBeVisible()
      expect(await viewer.locator('img').evaluate((image: HTMLImageElement) => image.src)).toBe(
        coverSources[0],
      )

      const firstFileName = await page.locator('.gallery-debug-filename').innerText()
      await page.getByRole('button', { name: 'Next slide', exact: true }).click()
      await expect(page.locator('.gallery-debug-filename')).not.toHaveText(firstFileName)
      await expect(viewer.locator('img')).toBeVisible()
      const nextSrc = await viewer.locator('img').evaluate((image: HTMLImageElement) => image.src)
      allowedImages.add(nextSrc)
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle')
      expect(requestedImages.has(nextSrc)).toBe(true)
      expect([...requestedImages].filter((src) => !allowedImages.has(src))).toEqual([])
      await expect(viewer.locator('img')).toHaveCount(1)

      await page.getByRole('button', { name: 'Close gallery viewer', exact: true }).click()
      await expect(viewer).toHaveCount(0)
      await covers.nth(1).getByRole('button').click()
      await expect(viewer.locator('img')).toBeVisible()
      expect(await viewer.locator('img').evaluate((image: HTMLImageElement) => image.src)).toBe(
        coverSources[1],
      )
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle')
      expect([...requestedImages].filter((src) => !allowedImages.has(src))).toEqual([])
    })
  })
}
