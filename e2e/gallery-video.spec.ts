import { test, expect } from '@playwright/test'
import metadata from '../src/assets/images/galleries/galleries.json' with { type: 'json' }

const videoGalleries = Object.entries(metadata.galleries).filter(([, gallery]) =>
  Object.keys(gallery.images).some((name) => /\.mp4$/i.test(name)),
)

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  for (const [folder, gallery] of videoGalleries) {
    test.describe(`${folder} video at ${viewport.width}px`, () => {
      test.use({ viewport, reducedMotion: 'reduce' })

      test('loads no video until Play and stops playback on navigation or close', async ({
        page,
      }) => {
        const videoRequests: string[] = []
        page.on('request', (request) => {
          if (/\.mp4(?:\?|$)/i.test(request.url())) videoRequests.push(request.url())
        })

        await page.goto('/gallery?galleryDebug=true')
        await expect(page.locator('.gallery-section').first()).toBeVisible()
        // eslint-disable-next-line playwright/no-networkidle
        await page.waitForLoadState('networkidle')
        expect(videoRequests).toEqual([])
        await expect(page.locator('video')).toHaveCount(0)

        await page
          .locator('.gallery-section')
          .filter({
            hasText: gallery.title ?? folder,
          })
          .getByRole('button')
          .click()
        const viewer = page.locator('.modal-image-shell')
        // Videos follow the photos, so wrapping backwards from the cover reaches a video.
        await page.getByRole('button', { name: 'Previous slide', exact: true }).click()
        const video = viewer.locator('video')
        await expect(video).toBeVisible()
        await expect(video).toHaveAttribute('preload', 'none')
        await expect(video).toHaveAttribute('playsinline', '')
        await expect(video).toHaveAttribute('controls', '')
        await expect(viewer.locator('img')).toHaveCount(0)
        // eslint-disable-next-line playwright/no-networkidle
        await page.waitForLoadState('networkidle')
        expect(videoRequests).toEqual([])
        expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true)
        const bounds = await video.boundingBox()
        expect(bounds).not.toBeNull()
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width)

        // Retain the old element to verify playback actually stops when it is unmounted.
        const outgoingVideo = await video.evaluateHandle((element: HTMLVideoElement) => element)
        await video.evaluate((element: HTMLVideoElement) => element.play())
        await expect
          .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
          .toBeGreaterThan(0)
        expect(videoRequests.length).toBeGreaterThan(0)

        const fullscreen = page.getByRole('button', { name: 'Enter fullscreen', exact: true })
        // Fullscreen is capability-dependent, especially on mobile browser engines.
        /* eslint-disable playwright/no-conditional-in-test, playwright/no-conditional-expect */
        if (await fullscreen.isVisible()) {
          await fullscreen.click()
          await expect(
            page.getByRole('button', { name: 'Exit fullscreen', exact: true }),
          ).toBeVisible()
          await expect(video).toBeVisible()
          await expect(viewer.locator('.modal-image-viewport')).toHaveCount(0)
        }
        /* eslint-enable playwright/no-conditional-in-test, playwright/no-conditional-expect */

        await page.getByRole('button', { name: 'Next slide', exact: true }).click()
        await expect(video).toHaveCount(0)
        await expect(viewer.locator('img')).toBeVisible()
        expect(await outgoingVideo.evaluate((element) => element.paused)).toBe(true)
        await expect(
          page.getByRole('button', { name: 'Play slideshow', exact: true }),
        ).toBeVisible()

        await page.getByRole('button', { name: 'Previous slide', exact: true }).click()
        await expect(video).toBeVisible()
        const closingVideo = await video.evaluateHandle((element: HTMLVideoElement) => element)
        await video.evaluate((element: HTMLVideoElement) => element.play())
        await page.getByRole('button', { name: 'Close gallery viewer', exact: true }).click()
        await expect(viewer).toHaveCount(0)
        expect(await closingVideo.evaluate((element) => element.paused)).toBe(true)
      })
    })
  }
}
