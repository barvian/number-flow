import { resolve } from 'path'
import { defineConfig, createFilter } from 'vite'
import typescript from '@rollup/plugin-typescript'
import { minifyRaw } from 'babel-plugin-styled-components/lib/minify'
import MagicString from 'magic-string'
import * as pl from 'parse-literals'

const outDir = resolve(__dirname, 'dist')

export default defineConfig(({ mode }) => ({
	plugins: [minifyCSSLiterals()],
	build: {
		outDir,
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			formats: ['es', 'cjs'],
			fileName: 'index'
		},
		rollupOptions: {
			external: [],
			plugins: [
				typescript({
					tsconfig: resolve(__dirname, `./tsconfig${mode === 'production' ? '.build' : ''}.json`)
				})
			]
		}
	}
}))

/** @satisfies {import('vite').Plugin} */
function minifyCSSLiterals() {
	const filter = createFilter(/\.[jt]sx?$/)

	return {
		name: 'vite-plugin-minify-css-literals',
		enforce: 'pre',
		apply: 'build',
		transform(code, id) {
			if (!filter(id)) return null

			const templates = pl.parseLiterals(code)
			if (!templates.length) return code

			const ms = new MagicString(code)
			templates.forEach((template) => {
				if (template.tag !== 'css') return
				template.parts.forEach((part) => {
					if (part.start < part.end) {
						const [mini] = minifyRaw(part.text)
						ms.overwrite(part.start, part.end, mini)
					}
				})
			})

			return {
				code: ms.toString(),
				map: ms.generateMap({ hires: 'boundary' })
			}
		}
	}
}
