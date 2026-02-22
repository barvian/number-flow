import type { NextConfig } from 'next'
import webpack from 'webpack'

const nonceCsp = "style-src 'none' 'nonce-test-nonce'"

const nextConfig: NextConfig = {
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
	},
	devIndicators: {
		appIsrStatus: false
	}
}

export default nextConfig
