import NumberFlow, { NumberFlowGroup } from '@number-flow/react'

type Props = {
	seconds: number
}

export default function Countdown({ seconds }: Props) {
	const hh = Math.floor(seconds / 3600)
	const mm = Math.floor((seconds % 3600) / 60)
	const ss = seconds % 60

	return (
		<NumberFlowGroup>
			<div
				style={{ fontVariantNumeric: 'tabular-nums' }}
				className="~text-3xl/4xl flex items-baseline font-semibold"
			>
				<NumberFlow trend={-1} value={hh} format={{ minimumIntegerDigits: 2 }} />
				<NumberFlow
					prefix=":"
					trend={-1}
					value={mm}
					digits={{ 1: { max: 5 } }}
					format={{ minimumIntegerDigits: 2 }}
				/>
				<NumberFlow
					prefix=":"
					trend={-1}
					value={ss}
					digits={{ 1: { max: 5 } }}
					format={{ minimumIntegerDigits: 2 }}
				/>
			</div>
		</NumberFlowGroup>
	)
}
