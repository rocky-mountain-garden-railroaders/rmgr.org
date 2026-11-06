import { test, expect, type Page } from '@playwright/test'
import { navItems } from '../src/navItems'

async function openNavigation(page: Page, width: number) {
  if (width < 1280) {
    await page.locator('.v-app-bar button').click()
  }
}

test('GIVEN the app root URL WHEN the page loads THEN it shows the home page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main')).toContainText('About Us')
  await expect(page.getByRole('main')).toContainText('Rocky Mountain Garden Railroaders')
  await expect(page.getByRole('img', { name: 'RMGR garden railway highlight' })).toBeVisible()
})

test('GIVEN desktop navigation WHEN each link is followed THEN its page renders without runtime errors', async ({
  page,
}) => {
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

for (const width of [1440, 390]) {
  test(`GIVEN shared site styles at ${width}px WHEN content renders THEN Vuetify spacing and weights survive the reset`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })

    for (const path of ['/', '/g-scale', '/events', '/gallery', '/resources', '/contactUs']) {
      await page.goto(path)
      const main = page.getByRole('main')
      await expect(main.locator('.v-card-title').first()).toBeVisible()
      await expect(main.locator('.v-card-title').first()).toHaveCSS('color', 'rgb(77, 105, 97)')

      const spacing = await main.locator('[class]').evaluateAll((elements) =>
        elements.flatMap((element) => {
          const style = getComputedStyle(element)
          return [...element.classList].flatMap((className) => {
            const match = /^(mt|mb)-(\d+)$/.exec(className)
            if (!match) return []
            if (
              [...element.classList].some(
                (name) => name.startsWith(`${match[1]}-`) && /-(sm|md|lg|xl|xxl)-/.test(name),
              )
            )
              return []
            return [
              {
                className,
                actual: match[1] === 'mt' ? style.marginTop : style.marginBottom,
                expected: `${Number(match[2]) * 4}px`,
              },
            ]
          })
        }),
      )
      expect(spacing.length, path).toBeGreaterThan(0)
      for (const { className, actual, expected } of spacing) {
        expect(actual, `${path}: ${className}`).toBe(expected)
      }

      for (const [className, weight] of [
        ['font-weight-black', '900'],
        ['font-weight-bold', '700'],
        ['font-weight-light', '300'],
      ]) {
        const weights = await main
          .locator(`.${className}`)
          .evaluateAll((elements) =>
            elements.map((element) => getComputedStyle(element).fontWeight),
          )
        for (const actual of weights) {
          expect(actual, `${path}: ${className}`).toBe(weight)
        }
      }
    }

    await page.goto('/')
    const paragraphs = page.getByRole('main').locator('p')
    await expect(paragraphs.first()).toHaveCSS('margin-bottom', '16px')
    await expect(paragraphs.nth(1)).toHaveCSS('margin-bottom', '0px')
    await expect(paragraphs.first()).toHaveCSS('line-height', '25.6px')
    await expect(page.getByRole('main').getByText('What We Do', { exact: true })).toHaveCSS(
      'margin-bottom',
      '8px',
    )
  })

  test(`GIVEN themed links at ${width}px WHEN pages render THEN component colours and padding override link defaults`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/resources')
    const cards = page.getByRole('main').locator('.resource-card')
    await expect(cards.first()).toBeVisible()

    for (const card of await cards.all()) {
      await expect(card).toHaveCSS('color', 'rgb(30, 28, 15)')
      await expect(card).toHaveCSS('padding', '0px')
      await expect(card.locator('.text-on-surface')).toHaveCSS('color', 'rgb(30, 28, 15)')
      await expect(card.locator('.text-secondary')).toHaveCSS('color', 'rgb(183, 140, 41)')
    }

    await cards.first().hover()
    await expect(cards.first().locator('.text-on-surface')).toHaveCSS('color', 'rgb(30, 28, 15)')

    await page.goto('/')
    const contactLink = page
      .getByRole('main')
      .getByRole('link', { name: 'Contact Us', exact: true })
    await expect(contactLink).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(contactLink).toHaveCSS('padding', '0px 20px')
    await contactLink.hover()
    await expect(contactLink).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(contactLink).toHaveCSS('background-color', 'rgb(183, 140, 41)')

    await openNavigation(page, width)
    const navLink = page.locator('header').getByRole('link', { name: 'Resources', exact: true })
    await expect(navLink).toBeVisible()
    await expect(navLink).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(navLink).toHaveCSS('padding', '4px 16px')

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/resources')
    await expect(cards.first()).toHaveCSS('background-color', 'rgb(250, 248, 245)')
    await expect(cards.first().locator('.text-on-surface')).toHaveCSS('color', 'rgb(30, 28, 15)')
  })
}
