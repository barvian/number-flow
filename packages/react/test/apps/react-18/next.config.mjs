import webpack from 'webpack'

const nonceCsp = "style-src 'none' 'nonce-test-nonce'"
/** @type {import('next').NextConfig} */
const nextConfig = {
	async headers() {
		return [
			{
				source: '/nonce',
				headers: [
					{
						key: 'Content-Security-Policy',
						value: nonceCsp
					}
				]
			}
		]
	},
	webpack(config, context) {
		config.plugins.push(
			new webpack.DefinePlugin({
				__REACT_DEVTOOLS_GLOBAL_HOOK__: '({ isDisabled: true })'
			})
		)
		return config
	}
}

export default nextConfig
