<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'radix-vue'

const modelValue = defineModel({ default: [50] })
</script>

<template>
	<SliderRoot
		v-model="modelValue"
		class="relative flex h-5 w-[200px] touch-none select-none items-center"
	>
		<SliderTrack class="relative h-[3px] grow rounded-full bg-zinc-100 dark:bg-zinc-800">
			<SliderRange class="absolute h-full rounded-full bg-black dark:bg-white" />
		</SliderTrack>
		<SliderThumb
			className="relative block h-5 w-5 rounded-[1rem] bg-white shadow-md ring ring-black/10"
			aria-label="Volume"
		>
			<NumberFlow
				v-if="modelValue[0] != null"
				willChange
				:value="modelValue[0]"
				isolate
				continuous
				:opacityTiming="{
					duration: 250,
					easing: 'ease-out'
				}"
				:transformTiming="{
					easing: `linear(0, 0.0033 0.8%, 0.0263 2.39%, 0.0896 4.77%, 0.4676 15.12%, 0.5688, 0.6553, 0.7274, 0.7862, 0.8336 31.04%, 0.8793, 0.9132 38.99%, 0.9421 43.77%, 0.9642 49.34%, 0.9796 55.71%, 0.9893 62.87%, 0.9952 71.62%, 0.9983 82.76%, 0.9996 99.47%)`,
					duration: 500
				}"
				class="absolute bottom-8 left-1/2 -translate-x-1/2 text-lg font-semibold"
			/>
		</SliderThumb>
	</SliderRoot>
</template>
