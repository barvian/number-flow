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
import { Label } from 'react-aria-components'

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
					<Label className="flex items-baseline ps-1">
						<code className="text-muted text-xs">trend:</code>
						<DemoMenuButton>
							<code className="font-semibold">{option}</code>
						</DemoMenuButton>
					</Label>
					<DemoMenuItems>
						<DemoMenuItem
							textValue="default"
							onAction={() => setOption('default')}
							isDisabled={option === 'default'}
						>
							<code className="font-semibold">default</code>
						</DemoMenuItem>
						<DemoMenuItem
							textValue="+1"
							onAction={() => setOption('+1')}
							isDisabled={option === '+1'}
						>
							<code className="font-semibold">+1</code>
						</DemoMenuItem>
						<DemoMenuItem textValue="0" onAction={() => setOption('0')} isDisabled={option === '0'}>
							<code className="font-semibold">0</code>
						</DemoMenuItem>
						<DemoMenuItem
							textValue="-1"
							onAction={() => setOption('-1')}
							isDisabled={option === '-1'}
						>
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
