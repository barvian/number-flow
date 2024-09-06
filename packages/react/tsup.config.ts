import { defineConfig } from 'tsup'

export default defineConfig({
	sourcemap: false,
	entry: ['src/index.ts'],
	clean: true,
	minify: false,
	dts: true,
	format: ['esm', 'cjs']
})
