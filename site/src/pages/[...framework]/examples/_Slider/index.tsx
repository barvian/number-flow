import Demo, { type DemoProps } from '@/components/Demo'
import Example from './Example'
import type { Rename } from '@/lib/types'
import * as React from 'react'

export default function DemoHOC({
	children,
	...rest
}: Rename<Omit<DemoProps, 'children'>, 'code', 'children'>) {
	const [value, setValue] = React.useState(50)
	return (
		<Demo {...rest} className="pt-12" code={children}>
			<Example
				value={[value]}
				onValueChange={([value]) => value != null && setValue(value)}
				min={0}
				max={100}
				step={1}
			/>
		</Demo>
	)
}
