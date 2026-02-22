import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import node from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
	devToolbar: {
		enabled: false
	},
	vite: {
		plugins: [tailwindcss()]
	},
	adapter: node({
		mode: 'standalone'
	})
})
