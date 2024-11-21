import Demo, { type DemoProps } from '@/components/Demo'
import type { Rename } from '@/lib/types'
import NumberFlow from '@number-flow/react'
import useCycle from '@/hooks/useCycle'

const bouncySpring: EffectTiming = {
	duration: 750,
	easing:
		'linear(0,0.008,0.028,0.06,0.099,0.145,0.196,0.249,0.304,0.36,0.416,0.47,0.523,0.573,0.621,0.667,0.709,0.748,0.784,0.817,0.847,0.874,0.898,0.92,0.939,0.955,0.97,0.982,0.992,1.001,1.008,1.014,1.019,1.022,1.025,1.027,1.028,1.028,1.028,1.028,1.027,1.026,1.025,1.024,1.022,1.02,1.019,1.017,1.016,1.014,1.013,1.011,1.01,1.009,1.008,1.007,1.006,1.005,1.004,1.003,1.003,1.002,1.001,1.001,1.001,1,1,1,1,1,0.999,0.999,0.999,0.999,1)'
}

const opacityTiming: EffectTiming = { duration: 350, easing: 'ease-out' }

const NUMBERS = [124.23, 41.75, 2125.95]

export default function DemoHOC({
	children,
	...rest
}: Rename<Omit<DemoProps, 'children'>, 'code', 'children'>) {
	const [value, cycleValue] = useCycle(NUMBERS)

	return (
		<Demo {...rest} code={children} onClick={cycleValue}>
			<NumberFlow
				value={value}
				transformTiming={bouncySpring}
				opacityTiming={opacityTiming}
				className="~text-3xl/4xl font-semibold"
				style={{ '--number-flow-char-height': '0.85em' }}
			/>
		</Demo>
	)
}
