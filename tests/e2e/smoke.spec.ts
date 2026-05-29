import { expect, test } from '@playwright/test'

test.describe('Offentlige sider', () => {
  test('landingssiden viser GFGK og logg inn-knapp', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('GFGK')).toBeVisible()
    await expect(page.getByRole('link', { name: /logg inn/i })).toBeVisible()
  })

  test('login-siden har e-post- og passord-felt', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Logg inn')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('beskyttet rute sender til login', async ({ page }) => {
    await page.goto('/dashboard')
    // Proxy/middleware skal redirecte uautentiserte til /login
    await expect(page).toHaveURL(/\/login/)
  })
})
