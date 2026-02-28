import Demo, { type DemoProps } from '@/components/Demo'
import type { Rename } from '@/lib/types'
import NumberFlow, { type Value } from '@number-flow/react'
import useCycle from '@/hooks/useCycle'

const NUMBERS: Value[] = [3, 15, 50]

export default function DemoHOC({
	children,
	...rest
}: Rename<Omit<DemoProps, 'children'>, 'code', 'children'>) {
	const [value, cycleValue] = useCycle(NUMBERS)

	return (
		<Demo {...rest} code={children} onClick={cycleValue}>
			<NumberFlow
				locales="en-US"
				value={value}
				format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }}
				suffix="/mo"
				className="~text-3xl/4xl font-semibold"
			/>
		</Demo>
	)
}
