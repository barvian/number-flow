<script lang="ts">
	import NumberFlow from '@number-flow/svelte'
	import clsx from 'clsx/lite'
	import { Minus, Plus } from 'lucide-svelte'

	let {
		min = 0,
		value = $bindable(0),
		max = 99
	}: { min?: number; value?: number; max?: number } = $props()
	const defaultValue = value

	let input: HTMLInputElement

	let animated = $state(true)
	// Hide the caret during transitions so you can't see it shifting around:
	let showCaret = $state(true)

	function handleInput() {
		animated = false
		let next = value
		if (input.value === '') {
			next = defaultValue
		} else {
			const num = parseInt(input.value)
			if (!isNaN(num) && min <= num && num <= max) next = num
		}
		// Manually update the input.value in case the number stays the same e.g. 09 == 9
		input.value = String(next)
		value = next
	}

	function handlePointerDown(event: PointerEvent, diff: number) {
		animated = true
		if (event.pointerType === 'mouse') {
			event?.preventDefault()
			input.focus()
		}
		const newVal = Math.min(Math.max(value + diff, min), max)
		value = newVal
	}
</script>

<div
	class="focus-within:ring-accent group flex items-stretch rounded-md text-3xl font-semibold ring ring-zinc-200 transition-[box-shadow] focus-within:ring-2 dark:ring-zinc-800"
>
	<button
		aria-hidden="true"
		tabindex={-1}
		class="flex items-center pl-[.5em] pr-[.325em]"
		disabled={min != null && value <= min}
		onpointerdown={(event) => handlePointerDown(event, -1)}
	>
		<Minus class="size-4" absoluteStrokeWidth strokeWidth="3.5" />
	</button>
	<div
		class="relative grid items-center justify-items-center text-center [grid-template-areas:'overlap'] *:[grid-area:overlap]"
	>
		<input
			bind:this={input}
			class={clsx(
				showCaret ? 'caret-primary' : 'caret-transparent',
				'spin-hide w-[1.5em] bg-transparent py-2 text-center font-[inherit] text-transparent outline-none'
			)}
			style="font-kerning: none"
			type="number"
			{min}
			step="1"
			autocomplete="off"
			inputmode="numeric"
			{max}
			{value}
			oninput={handleInput}
		/>
		<NumberFlow
			{value}
			format={{ useGrouping: false }}
			aria-hidden="true"
			{animated}
			on:animationsstart={() => (showCaret = false)}
			on:animationsfinish={() => (showCaret = true)}
			class="pointer-events-none"
			willChange
		/>
	</div>
	<button
		aria-hidden="true"
		tabindex="-1"
		class="flex items-center pl-[.325em] pr-[.5em]"
		disabled={max != null && value >= max}
		onpointerdown={(event) => handlePointerDown(event, 1)}
	>
		<Plus class="size-4" absoluteStrokeWidth strokeWidth="3.5" />
	</button>
</div>
