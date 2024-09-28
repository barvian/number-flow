import NumberFlow, { DEFAULT_Y_TIMING } from '@number-flow/react'
import * as React from 'react'

type Props = {
	value: number
}

export default function FramerMotionExample({ value }: Props) {
	const supportsLinear = useSupportsLinear()

	return (
		<NumberFlow
			suppressHydrationWarning
			value={value}
			// Use linear() spring-based easings if supported, otherwise
			// fall back to default. Generated with Kevin Grajeda's tool:
			// https://www.kvin.me/css-springs
			yTiming={
				supportsLinear
					? {
							easing:
								'linear(0, 0.0011 0.45%, 0.0065 1.12%, 0.0293, 0.0653, 0.1116 5.16%, 0.2247 7.85%, 0.5887 15.69%, 0.6968, 0.7893 21.07%, 0.8597 23.54%, 0.9211, 0.9676 28.92%, 0.9859 30.26%, 1.0034 31.83%, 1.0222 34.07%, 1.0356 36.54%, 1.0435 39.23%, 1.046 42.37%, 1.0444 44.84%, 1.0405 47.53%, 1.0118 61.87%, 1.0027 69.49%, 0.9981 80.48%, 0.9991 99.98%)',
							duration: 900
						}
					: DEFAULT_Y_TIMING
			}
			className="~text-xl/4xl font-semibold [--number-flow-mask-height:0.25em]"
		/>
	)
}

function useSupportsLinear() {
	const [supportsLinear, setSupportsLinear] = React.useState(false)

	React.useEffect(() => {
		setSupportsLinear(CSS.supports('animation-timing-function', 'linear(1, 2)'))
	}, [])

	return supportsLinear
}
