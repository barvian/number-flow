import { test, expect } from '@playwright/test'
import fs from 'node:fs'

// Forced reflows can only be detected via Chrome's tracing:
test.skip(({ browserName, javaScriptEnabled }) => browserName !== 'chromium' || !javaScriptEnabled)

test('batches reads and writes to avoid layout thrashing', async ({ page, browser }, testInfo) => {
	await page.goto('/thrashing', { waitUntil: 'networkidle' })

	const tracePath = testInfo.outputPath('trace.json')
	await browser.startTracing(page, {
		path: tracePath,
		categories: [
			'devtools.timeline',
			'disabled-by-default-devtools.timeline',
			'disabled-by-default-devtools.timeline.stack'
		]
	})

	// Update both (ungrouped) flows in the same task, then let the animations play out:
	await page.evaluate(() => (window as unknown as { change: () => void }).change())
	await page.waitForTimeout(1500)

	await browser.stopTracing()

	const { traceEvents } = JSON.parse(fs.readFileSync(tracePath, 'utf8')) as {
		traceEvents: Array<{
			name: string
			args?: { beginData?: { stackTrace?: unknown[] } }
		}>
	}

	// Reflows forced from JS have a stack trace; at most one should happen after
	// the update writes (measureUpdated) and one after applying them (measureDidUpdate),
	// no matter how many flows update in the same task:
	const forcedReflows = traceEvents.filter(
		(e) => e.name === 'Layout' && e.args?.beginData?.stackTrace?.length
	)
	expect(forcedReflows.length).toBeLessThanOrEqual(2)
})
