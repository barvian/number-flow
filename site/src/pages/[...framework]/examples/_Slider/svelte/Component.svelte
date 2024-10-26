<script lang="ts">
	import { Slider, type SliderProps } from 'bits-ui'
	import NumberFlow from '@number-flow/svelte'

	let { value = $bindable([0]), ...props }: SliderProps = $props()
</script>

<div class="flex items-center gap-6">
	<Slider.Root
		{...props}
		class="relative flex h-5 w-[10rem] touch-none select-none items-center"
		bind:value
		let:thumbs
	>
		<span class="relative h-[3px] grow rounded-full bg-zinc-100 dark:bg-zinc-800">
			<Slider.Range class="absolute h-full rounded-full bg-black dark:bg-white" />
		</span>
		{#each thumbs as thumb}
			<Slider.Thumb
				class="relative block h-5 w-5 rounded-[1rem] bg-white shadow-md ring ring-black/10"
				{thumb}
			/>
		{/each}
	</Slider.Root>
	{#if value[0] != null}
		<div class="w-8 shrink-0 text-center">
			<NumberFlow
				willChange
				value={value[0]}
				aria-hidden
				continuous
				opacityTiming={{
					duration: 250,
					easing: 'ease-out'
				}}
				transformTiming={{
					easing: `linear(0, 0.0033 0.8%, 0.0263 2.39%, 0.0896 4.77%, 0.4676 15.12%, 0.5688, 0.6553, 0.7274, 0.7862, 0.8336 31.04%, 0.8793, 0.9132 38.99%, 0.9421 43.77%, 0.9642 49.34%, 0.9796 55.71%, 0.9893 62.87%, 0.9952 71.62%, 0.9983 82.76%, 0.9996 99.47%)`,
					duration: 500
				}}
				class="text-xl font-semibold"
			/>
		</div>
	{/if}
</div>
