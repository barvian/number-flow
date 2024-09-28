import Demo, { type DemoProps } from '@/components/Demo'
import useCycle from '@/hooks/useCycle'
import Example from './Example'
import type { Rename } from '@/lib/types'

const NUMBERS = [12398.4, -543.2, 3243.6]

export default function DemoHOC({
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
