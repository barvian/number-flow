import * as React from 'react'
import Demo, {
	DemoMenu,
	DemoMenuButton,
	DemoMenuItem,
	DemoMenuItems,
	type DemoProps
} from '@/components/Demo'
import NumberFlow, { type Trend } from '@number-flow/react'
import useCycle from '@/hooks/useCycle'

const NUMBERS = [20, 19]

const TRENDS: Record<string, Trend | undefined> = {
	default: undefined,
	'+1': 1,
	'0': 0,
	'-1': -1
}

export default function DemoHOC({ ...rest }: Omit<DemoProps, 'children' | 'code'>) {
	const [value, cycleValue] = useCycle(NUMBERS)

	const [option, setOption] = React.useState<keyof typeof TRENDS>('default')
	const trend = TRENDS[option]

	return (
		<Demo
			{...rest}
			title={
				<DemoMenu>
					<DemoMenuButton className="gap-1">
						<code className="text-muted">trend:</code>
						<code className="font-semibold">{option}</code>
					</DemoMenuButton>
					<DemoMenuItems>
						<DemoMenuItem onClick={() => setOption('default')} disabled={option === 'default'}>
							<code className="font-semibold">default</code>
						</DemoMenuItem>
						<DemoMenuItem onClick={() => setOption('+1')} disabled={option === '+1'}>
							<code className="font-semibold">+1</code>
						</DemoMenuItem>
						<DemoMenuItem onClick={() => setOption('0')} disabled={option === '0'}>
							<code className="font-semibold">0</code>
						</DemoMenuItem>
						<DemoMenuItem onClick={() => setOption('-1')} disabled={option === '-1'}>
							<code className="font-semibold">-1</code>
						</DemoMenuItem>
					</DemoMenuItems>
				</DemoMenu>
			}
			onClick={cycleValue}
		>
			<NumberFlow
				locales="en-US"
				trend={trend}
				value={value}
				className="~text-3xl/4xl text-primary font-semibold"
				style={{ '--number-flow-char-height': '0.85em' }}
			/>
		</Demo>
	)
}
