import type { NextConfig } from 'next'
import webpack from 'webpack'

const nextConfig: NextConfig = {
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
