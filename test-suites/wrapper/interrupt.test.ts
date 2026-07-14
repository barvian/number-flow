import { test, expect } from '@playwright/test'

test.skip(
	({ javaScriptEnabled, contextOptions }) =>
		!javaScriptEnabled || contextOptions.reducedMotion === 'reduce'
)

// Guards against removed symbols (e.g. `$`, `(`) popping at the wrong
// positions when updates interrupt in-flight animations — their ghosts
// would overlap neighboring symbols:
test('transitions interruptions correctly', async ({ page }) => {
	await page.goto('/interrupt', { waitUntil: 'networkidle' })

	const button = page.getByRole('button', { name: 'Cycle and pause' })
	// The flow's paused animations overflow over the button (WebKit hit-tests
	// them), so dispatch clicks directly:
	const cycle = () => button.dispatchEvent('click')

	// Start transitioning to accounting currency, paused mid-flight:
	await cycle()
	// Interrupt: the parens/currency symbols pop mid-animation:
	await cycle()
	await expect(page).toHaveScreenshot({ animations: 'allow' })

	// Interrupt again: the popped symbols get reclaimed mid-exit:
	await cycle()
	await expect(page).toHaveScreenshot({ animations: 'allow' })
})
