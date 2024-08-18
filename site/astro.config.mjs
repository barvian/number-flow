import { defineConfig } from 'astro/config'
import { readFileSync } from 'node:fs'
import tailwind from '@astrojs/tailwind'
import react from '@astrojs/react'
import pkg from '/../package/package.json'
import mdx from '@astrojs/mdx'

// https://astro.build/config
export default defineConfig({
	site: pkg.homepage,
	markdown: {
		shikiConfig: {
			theme: JSON.parse(readFileSync('./highlighter-theme.json', 'utf-8'))
		}
	},
	integrations: [
		tailwind({
			applyBaseStyles: false
		}),
		react(),
		mdx()
	]
})
