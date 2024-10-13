import NumberFlow from '@number-flow/react'
import * as RadixSlider from '@radix-ui/react-slider'
import clsx from 'clsx/lite'

export default function Slider({ value, className, ...props }: RadixSlider.SliderProps) {
	return (
		<RadixSlider.Root
			{...props}
			value={value}
			className={clsx(className, 'relative flex h-5 w-[200px] touch-none select-none items-center')}
		>
			<RadixSlider.Track className="relative h-[3px] grow rounded-full bg-zinc-100 dark:bg-zinc-800">
				<RadixSlider.Range className="absolute h-full rounded-full bg-black dark:bg-white" />
			</RadixSlider.Track>
			<RadixSlider.Thumb
				className="relative block h-5 w-5 rounded-[1rem] bg-white shadow-md ring ring-black/10"
				aria-label="Volume"
			>
				{value?.[0] != null && (
					<NumberFlow
						willChange
						value={value[0]}
						isolate
						opacityTiming={{
							duration: 250,
							easing: 'ease-out'
						}}
						transformTiming={{
							easing: `linear(0, 0.0033 0.8%, 0.0263 2.39%, 0.0896 4.77%, 0.4676 15.12%, 0.5688, 0.6553, 0.7274, 0.7862, 0.8336 31.04%, 0.8793, 0.9132 38.99%, 0.9421 43.77%, 0.9642 49.34%, 0.9796 55.71%, 0.9893 62.87%, 0.9952 71.62%, 0.9983 82.76%, 0.9996 99.47%)`,
							duration: 500
						}}
						className="absolute bottom-8 left-1/2 -translate-x-1/2 text-lg font-semibold"
					/>
				)}
			</RadixSlider.Thumb>
		</RadixSlider.Root>
	)
}
