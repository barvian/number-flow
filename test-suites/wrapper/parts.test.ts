import { test, expect } from '@playwright/test'

test('renders the correct parts', async ({ page }) => {
	await page.goto('/')

	const flow = await page.getByTestId('flow1')

	// Check for parts
	await expect(flow.locator('[part~=left]')).toBeAttached()
	await expect(flow.locator('[part~=currency]')).toBeAttached()
	await expect(flow.locator('[part~=symbol]')).toHaveCount(4)
	await expect(flow.locator('[part~=number]')).toBeAttached()
	await expect(flow.locator('[part~=integer]')).toBeAttached()
	await expect(flow.locator('[part~=fraction]')).toBeAttached()
	await expect(flow.locator('[part~=integer-digit]')).toHaveCount(2)
	await expect(flow.locator('[part~=fraction-digit]')).toHaveCount(2)
	await expect(flow.locator('[part~=digit]')).toHaveCount(4)
	await expect(flow.locator('[part~=suffix]')).toBeAttached()
	await expect(flow.locator('[part~=right]')).toBeAttached()
})
