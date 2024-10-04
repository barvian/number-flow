import Demo, { type DemoProps } from '@/components/Demo'
import useCycle from '@/hooks/useCycle'
import Example from './Example'
import type { Rename } from '@/lib/types'

const NUMBERS = [124.23, 41.75, 2125.95]
const DIFFS = [0.0564, -123.114, 0.0029]

export default function DemoHOC({
	children,
	...rest
}: Rename<Omit<DemoProps, 'children'>, 'code', 'children'>) {
	const [value, cycleValue] = useCycle(NUMBERS)
	const [diff, cycleDiff] = useCycle(DIFFS)

	function onClick() {
		cycleValue()
		cycleDiff()
	}

	return (
		<Demo {...rest} code={children} onClick={onClick}>
			<Example value={value} diff={diff} />
		</Demo>
	)
}
