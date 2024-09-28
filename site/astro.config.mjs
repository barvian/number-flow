import { defineConfig, envField } from 'astro/config'
import { readFileSync } from 'node:fs'
import tailwind from '@astrojs/tailwind'
import react from '@astrojs/react'
import pkg from '/../packages/number-flow/package.json'
import mdx from '@astrojs/mdx'
import vercel from '@astrojs/vercel/static'
// @ts-expect-error missing types
import sectionize from 'remark-sectionize'

// https://astro.build/config
export default defineConfig({
	site: pkg.homepage,
	markdown: {
		shikiConfig: {
			theme: JSON.parse(readFileSync('./highlighter-theme.json', 'utf-8'))
		},
		remarkPlugins: [sectionize]
	},
	experimental: {
		env: {
			schema: {
				GITHUB_TOKEN: envField.string({ context: 'server', access: 'secret' })
			}
		}
	},
	integrations: [
		tailwind({
			applyBaseStyles: false
		}),
		react(),
		mdx()
	],
	output: 'static',
	adapter: vercel({
		webAnalytics: {
			enabled: true
		}
	})
})
