import { test, expect } from '@playwright/test'

test('renders correctly', async ({ page, javaScriptEnabled }) => {
	await page.goto('/')
	await expect(page).toHaveScreenshot()
})
