import NumberFlow from '@number-flow/react'
import * as React from 'react'
import * as Slider from '@radix-ui/react-slider'

export default function RangeExample() {
	const [value, setValue] = React.useState(50)
	const onValueChange = React.useCallback(([value]: number[]) => {
		if (value != null) setValue(value)
	}, [])

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
						duration: 250,
						easing: 'ease-out'
					}}
					xTiming={{
						easing: `linear(0, 0.0033 0.8%, 0.0263 2.39%, 0.0896 4.77%, 0.4676 15.12%, 0.5688, 0.6553, 0.7274, 0.7862, 0.8336 31.04%, 0.8793, 0.9132 38.99%, 0.9421 43.77%, 0.9642 49.34%, 0.9796 55.71%, 0.9893 62.87%, 0.9952 71.62%, 0.9983 82.76%, 0.9996 99.47%)`,
						duration: 500
					}}
					spinTiming={{
						easing: `linear(0, 0.0033 0.8%, 0.0263 2.39%, 0.0896 4.77%, 0.4676 15.12%, 0.5688, 0.6553, 0.7274, 0.7862, 0.8336 31.04%, 0.8793, 0.9132 38.99%, 0.9421 43.77%, 0.9642 49.34%, 0.9796 55.71%, 0.9893 62.87%, 0.9952 71.62%, 0.9983 82.76%, 0.9996 99.47%)`,
						duration: 500
					}}
					root
					className="absolute bottom-8 left-1/2 -translate-x-1/2 text-lg font-semibold"
					style={{ '--number-flow-char-height': '0.85em' }}
				/>
			</Slider.Thumb>
		</Slider.Root>
	)
}
