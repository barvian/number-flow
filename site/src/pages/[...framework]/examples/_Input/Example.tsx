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

	const handleInput: React.ChangeEventHandler<HTMLInputElement> = (event) => {
		setAnimated(false)
		if (event.currentTarget.value === '') {
			onChange?.(defaultValue.current)
		}
		const num = parseInt(event.currentTarget.value)
		if (isNaN(num) || (min != null && num < min) || (max != null && num > max)) {
			// Revert input's value:
			if (inputRef.current) inputRef.current.value = String(value)
		} else {
			// Manually update value in case they i.e. start with a "0" or end with a "."
			// which won't trigger a DOM update (because the number is the same):
			if (inputRef.current) inputRef.current.value = String(num)
			onChange?.(num)
		}
	}

	const handlePointerDown =
		(diff: number): React.PointerEventHandler<HTMLButtonElement> =>
		(event) => {
			setAnimated(true)
			event?.preventDefault()
			const newVal = Math.min(Math.max(value + diff, min), max)
			inputRef.current?.focus()
			onChange?.(newVal)
		}

	return (
		<div className="animated-[box-shadow] group flex items-stretch rounded-md text-3xl font-semibold ring ring-zinc-200 focus-within:ring-2 focus-within:ring-blue-500 dark:ring-zinc-800">
			<button
				aria-hidden
				tabIndex={-1}
				className="flex items-center pl-[.375em] pr-[.25em]"
				disabled={min != null && value <= min}
				onPointerDown={handlePointerDown(-1)}
			>
				<Minus className="size-[.5em]" absoluteStrokeWidth strokeWidth={3} />
			</button>
			<div className="relative grid justify-items-center text-center [grid-template-areas:'overlap'] *:[grid-area:overlap]">
				<input
					ref={inputRef}
					className={clsx(
						showCaret ? 'caret-primary' : 'caret-transparent',
						'spin-hide w-[1.5em] bg-transparent text-center font-[inherit] text-transparent outline-none'
					)}
					style={{ fontKerning: 'none' }}
					type="number"
					min={min}
					step={1}
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
					style={{ '--number-flow-char-height': '0.85em' }}
				/>
			</div>
			<button
				aria-hidden
				tabIndex={-1}
				className="flex items-center pl-[.25em] pr-[.375em]"
				disabled={max != null && value >= max}
				onPointerDown={handlePointerDown(1)}
			>
				<Plus className="size-[.5em]" absoluteStrokeWidth strokeWidth={3} />
			</button>
		</div>
	)
}
