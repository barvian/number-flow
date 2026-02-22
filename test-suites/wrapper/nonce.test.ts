import { test, expect } from '@playwright/test'

test('supports nonce for SSR and hydration styles', async ({ page }) => {
	const response = await page.goto('/nonce', { waitUntil: 'networkidle' })
	const headers = response?.headers()
	expect(headers?.['content-security-policy'] ?? headers?.['Content-Security-Policy']).toContain(
		"style-src 'nonce-test-nonce'"
	)

	await expect(page).toHaveScreenshot()
})
