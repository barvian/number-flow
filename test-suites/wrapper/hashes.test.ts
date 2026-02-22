import { test, expect } from '@playwright/test'

test('supports CSP hashes for SSR and hydration styles', async ({ page }) => {
	const response = await page.goto('/hashes', { waitUntil: 'networkidle' })

	await expect(page).toHaveScreenshot()
})
