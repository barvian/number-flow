import Demo, { type DemoProps } from '@/components/Demo'
import type { Rename } from '@/lib/types'
import NumberFlow, { type Value } from '@number-flow/react'
import useCycle from '@/hooks/useCycle'

const NUMBERS: Value[] = [3, 25, 50]

export default function DemoHOC({
	children,
	...rest
}: Rename<Omit<DemoProps, 'children'>, 'code', 'children'>) {
	const [value, cycleValue] = useCycle(NUMBERS)

	return (
		<Demo {...rest} code={children} onClick={cycleValue}>
			<NumberFlow
				value={value}
				format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }}
				suffix="/mo"
				className="~text-xl/4xl font-semibold"
				style={{ '--number-flow-char-height': '0.85em' }}
			/>
		</Demo>
	)
}
