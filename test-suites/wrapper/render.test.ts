import { test, expect } from '@playwright/test'

test('renders correctly', async ({ page }) => {
	await page.goto('/')
	await expect(page).toHaveScreenshot()

	const flow = await page.getByTestId('flow')
	expect(await flow.getAttribute('role')).toBe('img')
	expect(await flow.getAttribute('aria-label')).toBe(':US$42.00/mo')

	// Check for parts
	await expect(page.locator('[part~=left]')).toBeAttached()
	await expect(page.locator('[part~=currency]')).toBeAttached()
	await expect(page.locator('[part~=number]')).toBeAttached()
	await expect(page.locator('[part~=integer]')).toBeAttached()
	await expect(page.locator('[part~=fraction]')).toBeAttached()
	await expect(page.locator('[part~=integer-digit]')).toHaveCount(2)
	await expect(page.locator('[part~=fraction-digit]')).toHaveCount(2)
	await expect(page.locator('[part~=digit]')).toHaveCount(4)
	await expect(page.locator('[part~=suffix]')).toBeAttached()
	await expect(page.locator('[part~=right]')).toBeAttached()
})
