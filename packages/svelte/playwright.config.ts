import { defineConfig } from '@playwright/test'
import { config } from '../../lib/playwright'

// Use prod build cause it includes hydration errors but excludes random Vite stuff:
export default defineConfig({
	...config,
	webServer: {
		...config.webServer,
		command: 'pnpm build:site && pnpm preview'
	}
})
