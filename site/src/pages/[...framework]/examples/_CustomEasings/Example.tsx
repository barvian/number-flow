import NumberFlow, { defaultYTiming } from '@number-flow/react'
import * as React from 'react'

type Props = {
	value: number
}

export default function CustomTimingsExample({ value }: Props) {
	const supportsLinear = useSupportsLinear()

	return (
		<NumberFlow
			value={value}
			// Use linear() spring-based easings if supported, otherwise
			// fall back to default. Generated with Kevin Grajeda's tool:
			// https://www.kvin.me/css-springs
			yTiming={
				// prettier-ignore
				supportsLinear
					? { duration: 900,  easing: 'linear(0, 0.0011 0.45%, 0.0064 1.12%, 0.0243 2.24%, 0.0579, 0.1018 4.93%, 0.21 7.62%, 0.5691 15.69%, 0.6723, 0.7609, 0.8344, 0.8932 26.45%, 0.9418, 0.9769 32.28%, 0.9994 34.97%, 1.0151 37.89%, 1.0244 41.02%, 1.0282 44.61%, 1.0262 49.77%, 1.0096 63.67%, 1.0028 72.41%, 0.9996 83.17%, 0.9994 99.98%)' }
					: defaultYTiming
			}
			className="~text-xl/4xl font-semibold [--number-flow-char-height:0.85em] [--number-flow-mask-height:0.25em]"
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
