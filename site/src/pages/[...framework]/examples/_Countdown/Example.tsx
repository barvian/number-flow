import NumberFlow from '@number-flow/react'
import * as React from 'react'

type Props = {
	active?: boolean
}

export default function CountdownExamples({ active = true }: Props) {
	const [timeLeft, setTimeLeft] = React.useState(3600) // 1 hour in seconds

	React.useEffect(() => {
		if (!active || timeLeft <= 0) return

		const interval = setInterval(() => {
			setTimeLeft((t) => t - 1)
		}, 1000)

		return () => {
			if (interval) clearInterval(interval)
		}
	}, [active, timeLeft])

	const hours = Math.floor(timeLeft / 3600)
	const minutes = Math.floor((timeLeft % 3600) / 60)
	const seconds = timeLeft % 60

	console.log(`${hours}:${minutes}:${seconds}`)

	return (
		<div
			style={{ fontVariantNumeric: 'tabular-nums', '--number-flow-char-height': '0.85em' }}
			className="~text-xl/4xl flex items-baseline font-semibold"
		>
			<NumberFlow trend="decreasing" value={hours} format={{ minimumIntegerDigits: 2 }} />
			:
			<NumberFlow trend="decreasing" value={minutes} format={{ minimumIntegerDigits: 2 }} />
			:
			<NumberFlow trend="decreasing" value={seconds} format={{ minimumIntegerDigits: 2 }} />
		</div>
	)
}
