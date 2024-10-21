import Demo, { type DemoProps } from '@/components/Demo'
import Example from './Example'
import * as React from 'react'
import type { Rename } from '@/lib/types'
import clsx from 'clsx/lite'

export default function DemoHOC({
	children,
	className,
	...rest
}: Rename<Omit<DemoProps, 'children'>, 'code', 'children'>) {
	const [value, setValue] = React.useState(0)
	return (
		<Demo {...rest} code={children} className={clsx(className, 'font-mac-ui')}>
			<Example value={value} min={0} max={99} onChange={setValue} />
		</Demo>
	)
}
