import { test, expect } from '@playwright/test'

test('preserves HTML yes/no and true/false attributes', async ({ page, javaScriptEnabled }) => {
	await page.goto('/', { waitUntil: javaScriptEnabled ? 'networkidle' : 'domcontentloaded' })

	const flow = page.getByTestId('flow1')
	await expect(flow).toHaveAttribute('translate', 'no')
	await expect(flow).toHaveAttribute('draggable', 'false')
	await expect(flow).toHaveAttribute('spellcheck', 'false')

	if (javaScriptEnabled) {
		await expect(flow).toHaveJSProperty('translate', false)
		await expect(flow).toHaveJSProperty('draggable', false)
		await expect(flow).toHaveJSProperty('spellcheck', false)

		await page.getByRole('button', { name: 'Change and pause' }).click()
		await expect(flow).toHaveAttribute('translate', 'no')
		await expect(flow).toHaveAttribute('draggable', 'false')
		await expect(flow).toHaveAttribute('spellcheck', 'false')
		await expect(flow).toHaveJSProperty('translate', false)
	}
})
