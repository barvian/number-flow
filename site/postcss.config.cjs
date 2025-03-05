module.exports = {
	plugins: [
		require('tailwindcss'),
		// @ts-expect-error no types
		require('postcss-easing-gradients')
	]
}
