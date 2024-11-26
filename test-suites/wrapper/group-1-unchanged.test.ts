import { test, expect } from '@playwright/test'

test.skip(
	({ javaScriptEnabled, contextOptions }) =>
		!javaScriptEnabled || contextOptions.reducedMotion === 'reduce'
)

test('transitions correctly', async ({ page, contextOptions }) => {
	// Not sure why this is necessary for Svelte Chromium/Safari but I couldn't get it to work without it:
	// https://www.reddit.com/r/sveltejs/comments/15m9jch/how_do_you_wait_for_sveltekit_to_be_completely/
	await page.goto('/group-1-unchanged', { waitUntil: 'networkidle' })

	await page.getByRole('button', { name: 'Change and pause' }).click()
	await expect(page).toHaveScreenshot({ animations: 'allow' })
})
