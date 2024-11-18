import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'

const outDir = resolve(__dirname, 'dist')

export default defineConfig(({ mode }) => ({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					isCustomElement: (tag) => tag === 'number-flow-vue'
				}
			}
		}),
		dts({
			tsconfigPath: resolve(__dirname, `./tsconfig${mode === 'production' ? '.build' : ''}.json`),
			rollupTypes: true,
			include: ['src']
		})
	],
	build: {
		outDir,
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			formats: ['es', 'cjs'],
			fileName: 'index'
		},
		rollupOptions: {
			external: ['vue', 'number-flow', 'esm-env'],
			output: {
				globals: {
					vue: 'Vue'
				}
			}
		}
	}
}))
