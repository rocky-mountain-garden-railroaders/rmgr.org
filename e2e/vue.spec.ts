import { test, expect } from '@playwright/test'

test('GIVEN the app root URL WHEN the page loads THEN it shows the home page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main')).toContainText('About Us')
  await expect(page.getByRole('main')).toContainText('Rocky Mountain Garden Railroaders')
  await expect(page.getByRole('img', { name: 'RMGR garden railway highlight' })).toBeVisible()
})
