import { test, expect } from '@playwright/test'

test('renders correctly', async ({ page }) => {
	await page.goto('/')
	await expect(page).toHaveScreenshot()
})
