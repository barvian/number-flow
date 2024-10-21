import { defineConfig, envField } from 'astro/config'
import react from '@astrojs/react'
import pkg from '/../packages/number-flow/package.json'
import mdx from '@astrojs/mdx'
import vercel from '@astrojs/vercel/serverless'
import shikiTheme from './highlighter-theme.json'

// https://astro.build/config
export default defineConfig({
	site: pkg.homepage,
	markdown: {
		shikiConfig: {
			theme: shikiTheme
		}
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
		react(),
		mdx(),
		{
			name: 'watch-shiki-theme',
			hooks: {
				'astro:config:setup'({ addWatchFile, config }) {
					addWatchFile(new URL('./highlighter-theme.json', config.root))
				}
			}
		}
	],
	output: 'hybrid',
	adapter: vercel({
		webAnalytics: {
			enabled: true
		}
	})
})
