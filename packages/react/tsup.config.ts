import { defineConfig } from 'tsup'

export default defineConfig({
	sourcemap: false,
	entry: ['src/index.tsx'],
	clean: true,
	minify: false,
	dts: true,
	format: ['esm', 'cjs']
})
