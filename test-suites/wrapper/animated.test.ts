import { test, expect } from '@playwright/test'

test.skip(({ javaScriptEnabled, contextOptions }) => !javaScriptEnabled || contextOptions.reducedMotion === 'reduce')

test('disabling animations while changing the value does not animate', async ({ page }) => {
	await page.goto('/disable-animated', { waitUntil: 'networkidle' })

	await page.getByRole('button', { name: 'Change and pause' }).click()

	const flow = await page.evaluateHandle('window.flow1')

	// ...but there should be no running animations, since `animated` was set to
	// `false` in the same update as the value change:
	const animations = await page.evaluate(
		(flow) => (flow as Element).shadowRoot!.getAnimations().length,
		flow
	)
	expect(animations).toBe(0)
})

test('enabling animations while changing the value animates', async ({ page }, testInfo) => {
	// Flaky on Vue + Svelte: their standalone wrappers apply `data` before the
	// updated `animated` prop, so enabling animation in the same update as a
	// value change doesn't reliably animate. Those apps mark themselves via
	// config metadata (see their playwright.config.ts).
	test.skip(
		['vue', 'svelte'].includes(testInfo.config.metadata?.framework),
		'Flaky on Vue/Svelte'
	)

	await page.goto('/enable-animated', { waitUntil: 'networkidle' })

	await page.getByRole('button', { name: 'Change and pause' }).click()
	await expect(page).toHaveScreenshot({ animations: 'allow' })
})
