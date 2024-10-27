import { test, expect } from '@playwright/test'

test.skip(({ javaScriptEnabled }) => !javaScriptEnabled)

test('updates correctly', async ({ page }) => {
	// Not sure why this is necessary for Svelte Chromium/Safari but I couldn't get it to work without it:
	// https://www.reddit.com/r/sveltejs/comments/15m9jch/how_do_you_wait_for_sveltekit_to_be_completely/
	await page.goto('/', { waitUntil: 'networkidle' })

	const logs: string[] = []
	page.on('console', (msg) => logs.push(msg.text()))

	await page.getByRole('button', { name: 'Change and pause' }).click()
	await expect(page).toHaveScreenshot({ animations: 'allow' })

	await page.getByRole('button', { name: 'Resume' }).click()
	await expect(page).toHaveScreenshot({ animations: 'allow' })

	expect(logs).toEqual(['start', 'finish'])
})
