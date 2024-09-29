import NumberFlow, { defaultXTiming, defaultYTiming } from '@number-flow/react'
import * as React from 'react'
import * as Slider from '@radix-ui/react-slider'
import throttle from 'lodash/throttle'

export default function RangeExample() {
	const [value, setValue] = React.useState(50)
	const onValueChange = React.useCallback(
		throttle(([value]: number[]) => {
			if (value != null) setValue(value)
		}, 100),
		[]
	)

	return (
		<Slider.Root
			className="relative flex h-5 w-[200px] touch-none select-none items-center"
			defaultValue={[value]}
			onValueChange={onValueChange}
			max={100}
			step={1}
		>
			<Slider.Track className="bg-blackA7 relative h-[3px] grow rounded-full">
				<Slider.Range className="absolute h-full rounded-full bg-white" />
			</Slider.Track>
			<Slider.Thumb
				className="relative block h-5 w-5 rounded-full bg-white ring ring-black/10"
				aria-label="Volume"
			>
				<NumberFlow
					value={value}
					fadeTiming={{
						duration: 150,
						easing: 'ease-out'
					}}
					xTiming={{
						...defaultXTiming,
						duration: 300
					}}
					yTiming={{
						...defaultYTiming,
						duration: 300
					}}
					root
					className="absolute bottom-8 left-1/2 -translate-x-1/2 text-lg font-semibold [--number-flow-char-height:0.85em] [--number-flow-mask-height:0.25em]"
				/>
			</Slider.Thumb>
		</Slider.Root>
	)
}
