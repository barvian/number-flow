import * as React from 'react'
import Demo, {
	DemoMenu,
	DemoMenuButton,
	DemoMenuItem,
	DemoMenuItems,
	type DemoProps
} from '@/components/Demo'
import NumberFlow, { type Trend } from '@number-flow/react'
import useCycle from '/src/hooks/useCycle'

const NUMBERS = [20, 19]

export default function DemoHOC({ ...rest }: Omit<DemoProps, 'children' | 'code'>) {
	const [value, cycleValue] = useCycle(NUMBERS)

	const [trend, setTrend] = React.useState<Trend>(true)

	return (
		<Demo
			{...rest}
			title={
				<DemoMenu>
					<DemoMenuButton className="gap-1">
						<code className="text-muted">trend:</code>
						<code className="font-semibold">{JSON.stringify(trend)}</code>
					</DemoMenuButton>
					<DemoMenuItems>
						<DemoMenuItem onClick={() => setTrend(true)} disabled={trend === true}>
							<code className="font-semibold">true</code>
						</DemoMenuItem>
						<DemoMenuItem onClick={() => setTrend(false)} disabled={trend === false}>
							<code className="font-semibold">false</code>
						</DemoMenuItem>
						<DemoMenuItem onClick={() => setTrend('increasing')} disabled={trend === 'increasing'}>
							<code className="font-semibold">"increasing"</code>
						</DemoMenuItem>
						<DemoMenuItem onClick={() => setTrend('decreasing')} disabled={trend === 'decreasing'}>
							<code className="font-semibold">"decreasing"</code>
						</DemoMenuItem>
					</DemoMenuItems>
				</DemoMenu>
			}
			onClick={cycleValue}
		>
			<NumberFlow
				trend={trend}
				value={value}
				className="~text-xl/4xl text-primary font-semibold"
				style={{ '--number-flow-char-height': '0.85em' }}
			/>
		</Demo>
	)
}
