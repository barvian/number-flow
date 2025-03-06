import { test, expect } from '@playwright/test'

test.skip(({ javaScriptEnabled }) => !javaScriptEnabled)

test('updates correctly', async ({ page, contextOptions }) => {
	await page.goto('/', { waitUntil: 'networkidle' })

	const logs: string[] = []
	page.on('console', (msg) => logs.push(msg.text()))

	await page.getByRole('button', { name: 'Change and pause' }).click()
	await expect(page).toHaveScreenshot({ animations: 'allow' })

	const flow = await page.evaluateHandle('window.flow1')
	// @ts-expect-error private _internals
	const ariaLabel = await page.evaluate((flow) => flow._internals.ariaLabel, flow)
	expect(ariaLabel).toBe(':US$152.00/mo')

	await page.getByRole('button', { name: 'Resume' }).click()
	await expect(page).toHaveScreenshot({ animations: 'allow' })

	if (contextOptions.reducedMotion === 'reduce') expect(logs).toEqual([])
	else expect(logs).toEqual(['start', 'finish'])
})
