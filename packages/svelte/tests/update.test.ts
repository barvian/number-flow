import { test, expect } from '@playwright/test'

test.skip(({ javaScriptEnabled }) => !javaScriptEnabled)

test('updates correctly', async ({ page }) => {
	// Not sure why this is necessary for Chromium/Safari but I couldn't get it to work without it:
	// https://www.reddit.com/r/sveltejs/comments/15m9jch/how_do_you_wait_for_sveltekit_to_be_completely/
	await page.goto('/', { waitUntil: 'networkidle' })
	const btn = page.getByRole('button', { name: 'Change' })
	await btn.click()
	await expect(page).toHaveScreenshot()
})
