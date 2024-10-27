<script lang="ts">
	import NumberFlow, { NumberFlowElement } from '@number-flow/svelte'
	import clsx from 'clsx/lite'
	import { Minus, Plus } from 'lucide-svelte'

	export let min = 0
	export let value = 0
	export let max = 99
	const defaultValue = value

	let flow: NumberFlowElement
	let input: HTMLInputElement

	// Hide the caret during transitions so you can't see it shifting around:
	let showCaret = true

	function handleInput() {
		flow.animated = false // addresses race condition with updating
		let next = value
		if (input.value === '') {
			next = defaultValue
		} else {
			const num = parseInt(input.value)
			if (!isNaN(num) && min <= num && num <= max) next = num
		}
		// Manually update the input.value in case the number stays the same i.e. 09 == 9
		input.value = String(next)
		value = next
	}

	function handlePointerDown(event: PointerEvent, diff: number) {
		flow.animated = true
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
		on:pointerdown={(event) => handlePointerDown(event, -1)}
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
			bind:value
			on:input={handleInput}
		/>
		<NumberFlow
			bind:el={flow}
			{value}
			format={{ useGrouping: false }}
			aria-hidden
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
		on:pointerdown={(event) => handlePointerDown(event, 1)}
	>
		<Plus class="size-4" absoluteStrokeWidth strokeWidth="3.5" />
	</button>
</div>
