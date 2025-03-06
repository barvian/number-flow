import { test, expect } from '@playwright/test'

test.skip(({ javaScriptEnabled }) => javaScriptEnabled)

test('server-side renders correctly', async ({ page }) => {
	await page.goto('/')
	await expect(page).toHaveScreenshot()

	const flow = await page.getByTestId('flow1')
	const wrapper = await page.getByLabel(':US$42.00/mo')
	expect(wrapper).toBeAttached()
	expect(await wrapper.getAttribute('role')).toBe('img')
})
