import { defineConfig } from '@playwright/test'
import { config } from '../../../../../lib/playwright'

export default defineConfig({
	...config,
	metadata: { framework: 'vue' }
})
