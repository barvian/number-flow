import { test, expect } from '@playwright/test'

test.skip(({ javaScriptEnabled }) => !javaScriptEnabled)

test.describe.configure({ mode: 'parallel' })

test('updates correctly', async ({ page }) => {
	await page.goto('/')
	const btn = page.getByRole('button')
	await btn.click()
	await expect(page).toHaveScreenshot()
})
