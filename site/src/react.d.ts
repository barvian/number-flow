import 'react'

declare module 'react' {
	interface CSSProperties {
		[key: `--${string}`]: string | number
	}

	namespace JSX {
		interface IntrinsicAttributes {
			'client:visible'?: boolean
		}
	}
}
