import tailwindcss from '@tailwindcss/vite'
import { createHash } from 'node:crypto'
import { styles } from '@number-flow/vue'

const hash = (style: string) => `'sha256-${createHash('sha256').update(style).digest('base64')}'`
const hashesCsp = `style-src ${styles.map(hash).join(' ')}`

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2024-04-03',
	devtools: { enabled: false },
	srcDir: 'src/',
	devServer: {
		port: 3039
	},
	routeRules: {
		'/nonce': {
			headers: {
				'Content-Security-Policy': "style-src 'nonce-test-nonce'"
			}
		},
		'/hashes': {
			headers: {
				'Content-Security-Policy': hashesCsp
			}
		}
	},
	modules: ['@nuxt/fonts'],
	css: [
		// CSS file in the project
		'~/assets/css/main.css'
	],
	imports: {
		// Breaks stuff b/c monorepo?
		// https://github.com/nuxt/nuxt/issues/18823
		autoImport: false
	},
	fonts: {
		defaults: {
			weights: [400],
			styles: ['normal'],
			subsets: ['latin']
		},
		experimental: {
			disableLocalFallbacks: true
		}
	},
	vite: {
		plugins: [tailwindcss()]
	}
})
