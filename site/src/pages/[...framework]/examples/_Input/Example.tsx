import NumberFlow from '@number-flow/react'
import clsx from 'clsx/lite'
import { Minus, Plus } from 'lucide-react'
import * as React from 'react'

type Props = {
	value?: number
	min?: number
	max?: number
	onChange?: (value: number) => void
}

export default function Input({ value = 0, min = -Infinity, max = Infinity, onChange }: Props) {
	const defaultValue = React.useRef(value)
	const inputRef = React.useRef<HTMLInputElement>(null)
	const [animated, setAnimated] = React.useState(true)
	// Hide the caret during transitions so you can't see it shifting around:
	const [showCaret, setShowCaret] = React.useState(true)

	const handleInput: React.ChangeEventHandler<HTMLInputElement> = ({ currentTarget: el }) => {
		setAnimated(false)
		if (el.value === '') {
			onChange?.(defaultValue.current)
			return
		}
		const num = parseInt(el.value)
		if (isNaN(num) || (min != null && num < min) || (max != null && num > max)) {
			// Revert input's value:
			el.value = String(value)
		} else {
			// Manually update value in case they i.e. start with a "0" or end with a "."
			// which won't trigger a DOM update (because the number is the same):
			el.value = String(num)
			onChange?.(num)
		}
	}

	const handlePointerDown = (diff: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
		setAnimated(true)
		if (event.pointerType === 'mouse') {
			event?.preventDefault()
			inputRef.current?.focus()
		}
		const newVal = Math.min(Math.max(value + diff, min), max)
		onChange?.(newVal)
	}

	return (
		<div className="group flex items-stretch rounded-md text-3xl font-semibold ring ring-zinc-200 transition-[box-shadow] focus-within:ring-2 focus-within:ring-blue-500 dark:ring-zinc-800">
			<button
				aria-hidden
				tabIndex={-1}
				className="flex items-center pl-[.5em] pr-[.325em]"
				disabled={min != null && value <= min}
				onPointerDown={handlePointerDown(-1)}
			>
				<Minus className="size-4" absoluteStrokeWidth strokeWidth={3.5} />
			</button>
			<div className="relative grid items-center justify-items-center text-center [grid-template-areas:'overlap'] *:[grid-area:overlap]">
				<input
					ref={inputRef}
					className={clsx(
						showCaret ? 'caret-primary' : 'caret-transparent',
						'spin-hide w-[1.5em] bg-transparent py-2 text-center font-[inherit] text-transparent outline-none'
					)}
					// Make sure to disable kerning, to match NumberFlow:
					style={{ fontKerning: 'none' }}
					type="number"
					min={min}
					step={1}
					autoComplete="off"
					inputMode="numeric"
					max={max}
					value={value}
					onInput={handleInput}
				/>
				<NumberFlow
					value={value}
					format={{ useGrouping: false }}
					aria-hidden
					animated={animated}
					onAnimationsStart={() => setShowCaret(false)}
					onAnimationsFinish={() => setShowCaret(true)}
					className="pointer-events-none"
					willChange
				/>
			</div>
			<button
				aria-hidden
				tabIndex={-1}
				className="flex items-center pl-[.325em] pr-[.5em]"
				disabled={max != null && value >= max}
				onPointerDown={handlePointerDown(1)}
			>
				<Plus className="size-4" absoluteStrokeWidth strokeWidth={3.5} />
			</button>
		</div>
	)
}
