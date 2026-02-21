import { test, expect } from '@playwright/test'

test('supports nonce for SSR and hydration styles', async ({ page }) => {
	const response = await page.goto('/nonce', { waitUntil: 'networkidle' })
	expect(response?.headers()['content-security-policy']).toContain(
		"style-src 'self' 'nonce-test-nonce'"
	)

	await expect(page).toHaveScreenshot()
})
