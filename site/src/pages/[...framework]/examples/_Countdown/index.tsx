import * as React from 'react'
import Demo, { type DemoProps } from '@/components/Demo'
import Example from './Example'
import type { Rename } from '@/lib/types'
import { useInView } from 'framer-motion'

export default function DemoIndicator({
	children,
	...rest
}: Rename<Omit<DemoProps, 'children'>, 'code', 'children'>) {
	const ref = React.useRef<HTMLDivElement>(null)
	const inView = useInView(ref)

	return (
		<Demo ref={ref} {...rest} code={children}>
			<Example active={inView} />
		</Demo>
	)
}
