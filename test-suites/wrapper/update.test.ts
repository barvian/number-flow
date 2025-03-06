import { test, expect } from '@playwright/test'

test.skip(({ javaScriptEnabled }) => !javaScriptEnabled)

test('updates correctly', async ({ page, contextOptions }) => {
	const logs: string[] = []
	page.on('console', (msg) => logs.push(msg.text()))

	// Not sure why this is necessary for Svelte Chromium/Safari but I couldn't get it to work without it:
	// https://www.reddit.com/r/sveltejs/comments/15m9jch/how_do_you_wait_for_sveltekit_to_be_completely/
	await page.goto('/', { waitUntil: 'networkidle' })

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
