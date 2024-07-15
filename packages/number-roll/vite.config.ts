import { resolve } from 'path'
import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'NumberRoll',
			fileName: 'index'
		},
		rollupOptions: {
			plugins: [
				typescript({
					noEmitOnError: true,
					exclude: ['tests/**/*.ts']
				})
			]
		}
	}
})
