<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
import { Minus, Plus } from 'lucide-vue-next'
import { ref, useTemplateRef } from 'vue'

const { min = 0, max = 99 } = defineProps<{
	min?: number
	max?: number
}>()

const modelValue = defineModel({ default: 0 })
const defaultValue = modelValue.value

const inputRef = useTemplateRef('input')
const animated = ref(true)
// Hide the caret during transitions so you can't see it shifting around:
const showCaret = ref(true)

function handleInput({ currentTarget }: Event) {
	const input = currentTarget as HTMLInputElement // nicer than inputRef.value.value

	animated.value = false
	let next = modelValue.value
	if (input.value === '') {
		next = defaultValue
	} else {
		const num = parseInt(input.value)
		if (!isNaN(num) && min <= num && num <= max) next = num
	}
	// Manually update the input.value in case the number stays the same e.g. 09 == 9
	input.value = String(next)
	modelValue.value = next
}

function handlePointerDown(event: PointerEvent, diff: number) {
	animated.value = true
	if (event.pointerType === 'mouse') {
		event?.preventDefault()
		inputRef.value?.focus()
	}
	const newVal = Math.min(Math.max(modelValue.value + diff, min), max)
	modelValue.value = newVal
}
</script>

<template>
	<div
		class="focus-within:ring-accent group flex items-stretch rounded-md text-3xl font-semibold ring ring-zinc-200 transition-[box-shadow] focus-within:ring-2 dark:ring-zinc-800"
	>
		<button
			aria-hidden
			tabindex="{-1}"
			class="flex items-center pl-[.5em] pr-[.325em]"
			:disabled="min != null && modelValue <= min"
			@pointerdown="handlePointerDown($event, -1)"
		>
			<Minus class="size-4" absoluteStrokeWidth strokeWidth="3.5" />
		</button>
		<div
			class="relative grid items-center justify-items-center text-center [grid-template-areas:'overlap'] *:[grid-area:overlap]"
		>
			<input
				ref="input"
				:class="[
					showCaret ? 'caret-primary' : 'caret-transparent',
					'spin-hide w-[1.5em] bg-transparent py-2 text-center font-[inherit] text-transparent outline-none'
				]"
				:style="{ fontKerning: 'none' /* match NumberFlow */ }"
				type="number"
				:min
				step="1"
				autocomplete="off"
				inputmode="numeric"
				:max
				:value="modelValue"
				@input="handleInput"
			/>
			<NumberFlow
				:value="modelValue"
				:format="{ useGrouping: false }"
				aria-hidden
				:animated
				@animationsstart="showCaret = false"
				@animationsfinish="showCaret = true"
				class="pointer-events-none"
				willChange
			/>
		</div>
		<button
			aria-hidden
			tabindex="-1"
			class="flex items-center pl-[.325em] pr-[.5em]"
			:disabled="max != null && modelValue >= max"
			@pointerdown="handlePointerDown($event, 1)"
		>
			<Plus class="size-4" absoluteStrokeWidth strokeWidth="3.5" />
		</button>
	</div>
</template>
