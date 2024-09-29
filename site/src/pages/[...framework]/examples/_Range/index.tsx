import Demo, { type DemoProps } from '@/components/Demo'
import Example from './Example'
import type { Rename } from '@/lib/types'

export default function DemoHOC({
	children,
	...rest
}: Rename<Omit<DemoProps, 'children'>, 'code', 'children'>) {
	return (
		<Demo {...rest} className="!~pt-16/18" code={children}>
			<Example />
		</Demo>
	)
}
