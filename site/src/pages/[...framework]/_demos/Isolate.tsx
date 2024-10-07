import Demo, { type DemoProps } from '@/components/Demo'
import NumberFlow from '@number-flow/react'
import * as React from 'react'

export default function DemoHOC({ ...rest }: Omit<DemoProps, 'children' | 'code'>) {
	const [on, setOn] = React.useState(false)

	return (
		<Demo {...rest} onClick={() => setOn((o) => !o)}>
			<code>{'isolate'}</code>
			<div className="mb-4 flex items-center gap-3">
				{on && <div className="w-18 bg-faint h-4 rounded-sm" />}
				<NumberFlow isolate value={on ? 1.2423 : 0.4175} format={{ style: 'percent' }} />
			</div>
			<span className="text-center">
				<code>{'isolate={false}'}</code> (default)
			</span>
			<div className="flex items-center gap-3">
				{on && <div className="w-18 bg-faint h-4 rounded-sm" />}
				<NumberFlow value={on ? 1.2423 : 0.4175} format={{ style: 'percent' }} />
			</div>
		</Demo>
	)
}
