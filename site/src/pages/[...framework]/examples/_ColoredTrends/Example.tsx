import NumberFlow, { NumberFlowElement } from '@number-flow/react'
import * as React from 'react'

type Props = {
	value: number
}

export default function PriceWithColoredTrend({ value }: Props) {
	const ref = React.useRef<NumberFlowElement>(null)

	const prevValue = React.useRef(value)
	React.useEffect(() => {
		if (value > prevValue.current)
			ref.current?.animate(
				{ color: ['unset', '#34d399', 'unset'] },
				{ easing: 'ease', duration: 300 }
			)
		else if (value < prevValue.current)
			ref.current?.animate(
				{ color: ['unset', '#f87171', 'unset'] },
				{ easing: 'ease', duration: 300 }
			)

		return () => {
			prevValue.current = value
		}
	}, [value])

	return (
		<NumberFlow
			ref={ref}
			value={value}
			format={{
				style: 'currency',
				currency: 'USD'
			}}
			className="~text-xl/4xl font-semibold"
			style={{ '--number-flow-char-height': '0.85em' }}
		/>
	)
}
