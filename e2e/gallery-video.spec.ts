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
    test.describe(`GIVEN the ${folder} gallery at ${viewport.width}px WHEN selected THEN`, () => {
      test.use({ viewport, reducedMotion: 'reduce' })

      test('GIVEN a video slide WHEN selected THEN it autoplays muted and stops on navigation or close', async ({
        page,
      }) => {
        const videoRequests: string[] = []
        page.on('request', (request) => {
          if (/\.mp4(?:\?|$)/i.test(request.url())) videoRequests.push(request.url())
        })

        await page.goto('/gallery?galleryDebug=true')
        await expect(page.locator('.gallery-section').first()).toBeVisible()

        await page
          .locator('.gallery-section')
          .filter({
            hasText: gallery.title ?? folder,
          })
          .getByRole('button')
          .click()
        const viewer = page.locator('.modal-image-shell')
        const cover = viewer.locator('img')
        await expect(cover).toBeVisible()
        await expect
          .poll(() =>
            cover.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
          )
          .toBe(true)
        expect(videoRequests).toEqual([])
        await expect(page.locator('video')).toHaveCount(0)

        await page.getByRole('button', { name: 'Previous slide', exact: true }).click()
        const video = viewer.locator('video')
        await expect(video).toBeVisible()
        await expect(video).toHaveAttribute('preload', 'none')
        await expect(video).toHaveAttribute('playsinline', '')
        await expect(video).toHaveAttribute('controls', '')
        await expect(viewer.locator('img')).toHaveCount(0)
        await expect
          .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
          .toBeGreaterThan(0)
        expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(false)
        expect(await video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(true)
        const activeVideoUrl = new URL((await video.getAttribute('src'))!, page.url()).href
        expect(videoRequests).toContain(activeVideoUrl)
        const bounds = await video.boundingBox()
        expect(bounds).not.toBeNull()
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width)

        const outgoingVideo = await video.evaluateHandle((element: HTMLVideoElement) => element)
        await expect
          .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
          .toBeGreaterThan(0)
        expect(videoRequests.length).toBeGreaterThan(0)

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
        await expect
          .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
          .toBeGreaterThan(0)
        await page.getByRole('button', { name: 'Close gallery viewer', exact: true }).click()
        await expect(viewer).toHaveCount(0)
        expect(await closingVideo.evaluate((element) => element.paused)).toBe(true)
      })
    })
  }
}

test('GIVEN a video slide WHEN fullscreen is entered THEN playback and navigation continue', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gallery?galleryDebug=true')
  expect(
    await page.evaluate(
      () => document.fullscreenEnabled && 'requestFullscreen' in Element.prototype,
    ),
  ).toBe(true)

  const [folder, gallery] = videoGalleries[0]
  await page
    .locator('.gallery-section')
    .filter({ hasText: gallery.title ?? folder })
    .getByRole('button')
    .click()
  await page.getByRole('button', { name: 'Previous slide', exact: true }).click()

  const viewer = page.locator('.modal-image-shell')
  const video = viewer.locator('video')
  await expect(video).toBeVisible()
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
    .toBeGreaterThan(0)
  const timeBeforeFullscreen = await video.evaluate(
    (element: HTMLVideoElement) => element.currentTime,
  )

  await page.getByRole('button', { name: 'Enter fullscreen', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Exit fullscreen', exact: true })).toBeVisible()
  await expect(video).toBeVisible()
  await expect(viewer.locator('.modal-image-viewport')).toHaveCount(0)
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
    .toBeGreaterThan(timeBeforeFullscreen)

  const outgoingVideo = await video.evaluateHandle((element: HTMLVideoElement) => element)
  await page.getByRole('button', { name: 'Next slide', exact: true }).click()
  await expect(video).toHaveCount(0)
  expect(await outgoingVideo.evaluate((element) => element.paused)).toBe(true)
  await expect(viewer.locator('.modal-image-viewport')).toBeVisible()
})

const [policyFolder, policyGallery] = videoGalleries[0]
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`GIVEN autoplay is rejected at ${viewport.width}px WHEN the video opens THEN manual playback remains available`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.addInitScript(() => {
      const nativePlay = HTMLMediaElement.prototype.play
      let rejectAutoplay = true
      Object.defineProperty(window, '__allowGalleryVideoPlay', {
        configurable: true,
        set: (allow) => {
          rejectAutoplay = !allow
        },
      })
      HTMLMediaElement.prototype.play = function () {
        if (this.classList.contains('gallery-video') && rejectAutoplay) {
          return Promise.reject(new DOMException('User gesture required', 'NotAllowedError'))
        }
        return nativePlay.call(this)
      }
    })
    await page.goto('/gallery')
    await page
      .locator('.gallery-section')
      .filter({ hasText: policyGallery.title ?? policyFolder })
      .getByRole('button')
      .click()
    await page.getByRole('button', { name: 'Previous slide', exact: true }).click()

    const video = page.locator('.gallery-video')
    await expect(video).toHaveAttribute('controls', '')
    await expect(page.getByRole('status')).toContainText('Autoplay was blocked')
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true)

    await page.evaluate(() => {
      ;(window as Window & { __allowGalleryVideoPlay?: boolean }).__allowGalleryVideoPlay = true
    })
    await video.evaluate((element: HTMLVideoElement) => element.play())
    await expect(page.getByRole('status')).toHaveCount(0)
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
      .toBeGreaterThan(0)
    expect(await video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(true)
  })
}
