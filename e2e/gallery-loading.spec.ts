import { test, expect } from '@playwright/test'

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test.describe(`GIVEN a ${viewport.width}px viewport WHEN opening the gallery THEN`, () => {
    test.use({ viewport, reducedMotion: 'reduce' })

    test('GIVEN the gallery chooser WHEN selecting a gallery THEN only covers and the active photo are requested', async ({
      page,
    }) => {
      const requestedImages = new Set<string>()
      page.on('request', (request) => {
        if (request.resourceType() === 'image') requestedImages.add(request.url())
      })

      await page.goto('/gallery?galleryDebug=true')
      const covers = page.locator('.gallery-section')
      const coverImages = covers.locator('img[src]')
      const viewer = page.locator('.modal-image-shell')
      await expect(coverImages.first()).toBeVisible()
      await expect
        .poll(() =>
          coverImages
            .first()
            .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
        )
        .toBe(true)
      const initialCoverCount = await coverImages.count()
      expect(initialCoverCount).toBeGreaterThan(0)
      expect(initialCoverCount).toBeLessThan(await covers.count())
      await expect(viewer).toHaveCount(0)

      for (const cover of await covers.all()) {
        await cover.scrollIntoViewIfNeeded()
        const image = cover.locator('img[src]')
        await expect(image).toBeVisible()
        await expect
          .poll(() =>
            image.evaluate(
              (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
            ),
          )
          .toBe(true)
      }
      const coverSources = await coverImages.evaluateAll((images) =>
        images.map((image) => (image as HTMLImageElement).src),
      )
      expect(coverSources.every((src) => !src.startsWith('data:'))).toBe(true)
      const logoSources = await page
        .locator('header img[src]')
        .evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src))
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
      const currentImage = viewer.locator('img')
      await expect(currentImage).toBeVisible()
      await expect
        .poll(() =>
          currentImage.evaluate(
            (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
          ),
        )
        .toBe(true)
      const nextSrc = await currentImage.evaluate((image: HTMLImageElement) => image.src)
      allowedImages.add(nextSrc)
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
      await expect
        .poll(() =>
          viewer
            .locator('img')
            .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
        )
        .toBe(true)
      expect([...requestedImages].filter((src) => !allowedImages.has(src))).toEqual([])
    })
  })
}
