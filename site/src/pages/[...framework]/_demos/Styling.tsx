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
				value={value}
				format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }}
				suffix="/mo"
				className="~text-3xl/4xl part-[suffix]:font-normal part-[suffix]:text-muted part-[suffix]:text-[0.75em] part-[suffix]:ml-[0.0625em] font-semibold"
				style={{ '--number-flow-char-height': '0.85em' }}
			/>
		</Demo>
	)
}
