import { test, expect } from '@playwright/test'

test.skip(({ javaScriptEnabled }) => !javaScriptEnabled)

test('renders correctly', async ({ page }) => {
	await page.goto('/', { waitUntil: 'networkidle' })
	await expect(page).toHaveScreenshot()

	// Check for console errors:
	const logs: string[] = []
	page.on('console', (msg) => logs.push(msg.text()))

	// Ensure correct role and aria-label:
	const flow = await page.evaluateHandle('window.flow1')
	// @ts-expect-error private _internals
	const role = await page.evaluate((flow) => flow._internals.role, flow)
	// @ts-expect-error private _internals
	const ariaLabel = await page.evaluate((flow) => flow._internals.ariaLabel, flow)
	expect(role).toBe('img')
	expect(ariaLabel).toBe(':US$42.00/mo')

	expect(logs).toEqual([])
})
