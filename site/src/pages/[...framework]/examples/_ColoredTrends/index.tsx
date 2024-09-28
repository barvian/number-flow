import Demo, { type DemoProps } from '@/components/Demo'
import useCycle from '@/hooks/useCycle'
import Example from './Example'
import type { Rename } from '@/lib/types'

const NUMBERS = [12398.432, -3243.6, 543.2]

export default function DemoIndicator({
	children,
	...rest
}: Rename<Omit<DemoProps, 'children'>, 'code', 'children'>) {
	const [value, cycleValue] = useCycle(NUMBERS)

	function onClick() {
		cycleValue()
	}

	return (
		<Demo {...rest} code={children} onClick={onClick}>
			<Example value={value} />
		</Demo>
	)
}
