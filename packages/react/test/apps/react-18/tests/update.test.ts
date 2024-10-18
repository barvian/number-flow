import { test, expect } from '@playwright/test'

test.skip(({ javaScriptEnabled }) => !javaScriptEnabled)

test('updates correctly', async ({ page }) => {
	await page.goto('/')
	const btn = page.getByRole('button', { name: 'Change' })
	await btn.click()
	await expect(page).toHaveScreenshot()
})
