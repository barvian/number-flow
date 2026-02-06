import Demo, { DemoSwitch, type DemoProps } from '@/components/Demo'
import NumberFlow, { continuous } from '@number-flow/react'
import * as React from 'react'
import useCycle from '@/hooks/useCycle'
import type { Rename } from '@/lib/types'

const NUMBERS = [120, 140]

export default function DemoHOC({
	children,
	...rest
}: Rename<Omit<DemoProps, 'children'>, 'code', 'children'>) {
	const [value, cycleValue] = useCycle(NUMBERS)
	const [useContinuous, setUseContinuous] = React.useState(true)

	return (
		<Demo
			code={children}
			{...rest}
			title={
				<DemoSwitch isSelected={useContinuous} onChange={setUseContinuous}>
					<code className="font-semibold">continuous</code>
				</DemoSwitch>
			}
			onClick={cycleValue}
		>
			<div className="~text-3xl/4xl flex items-center gap-4">
				<NumberFlow
					locales="en-US"
					plugins={useContinuous ? [continuous] : undefined}
					style={{ '--number-flow-char-height': '0.85em' }}
					value={value}
					className="font-semibold"
				/>
			</div>
		</Demo>
	)
}
