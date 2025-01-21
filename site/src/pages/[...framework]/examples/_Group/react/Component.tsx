import NumberFlow, { NumberFlowGroup } from '@number-flow/react'
import clsx from 'clsx/lite'

type Props = {
	value: number
	diff: number
}

export default function PriceWithDiff({ value, diff }: Props) {
	return (
		<NumberFlowGroup>
			<div
				style={{ '--number-flow-char-height': '0.85em' }}
				className="flex items-center gap-4 font-semibold"
			>
				<NumberFlow
					value={value}
					locales="en-US"
					format={{ style: 'currency', currency: 'USD' }}
					className="~text-2xl/4xl"
				/>
				<NumberFlow
					value={diff}
					locales="en-US"
					format={{ style: 'percent', maximumFractionDigits: 2, signDisplay: 'always' }}
					className={clsx(
						'~text-lg/2xl transition-colors duration-300',
						diff < 0 ? 'text-red-500' : 'text-emerald-500'
					)}
				/>
			</div>
		</NumberFlowGroup>
	)
}
