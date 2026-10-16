import { test, expect } from '@playwright/test'
import { navItems } from '../src/navItems'

test('GIVEN the app root URL WHEN the page loads THEN it shows the home page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main')).toContainText('About Us')
  await expect(page.getByRole('main')).toContainText('Rocky Mountain Garden Railroaders')
  await expect(page.getByRole('img', { name: 'RMGR garden railway highlight' })).toBeVisible()
})

test('GIVEN desktop navigation WHEN each link is followed THEN its page renders without runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  for (const item of navItems) {
    await page.getByRole('link', { name: item.title, exact: true }).click()
    await expect(page).toHaveURL(item.to)
    await expect(page.getByRole('main')).toContainText(
      item.to === '/contactUs' ? 'Get in Touch' : item.title,
    )
  }

  expect(errors).toEqual([])
})
