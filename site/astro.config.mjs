import { defineConfig, envField } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import react from '@astrojs/react'
import pkg from '/../packages/number-flow/package.json'
import mdx from '@astrojs/mdx'
import vercel from '@astrojs/vercel/serverless'
import theme from './shiki-theme'
// @ts-expect-error missing types
import sectionize from 'remark-sectionize'

// https://astro.build/config
export default defineConfig({
	site: pkg.homepage,
	markdown: {
		shikiConfig: {
			theme
		},
		remarkPlugins: [sectionize]
	},
	vite: {
		ssr: {
			// Fixes build issue on macOS
			external: ['fsevents']
		}
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
	output: 'hybrid',
	adapter: vercel({
		webAnalytics: {
			enabled: true
		}
	})
})
