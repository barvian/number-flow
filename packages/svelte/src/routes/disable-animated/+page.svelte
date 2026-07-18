<script lang="ts">
	import NumberFlow, { NumberFlowElement } from '$lib/index.js'
	import { tick } from 'svelte'

	let state = { value: 42, animated: true }
	let el: NumberFlowElement | undefined

	async function change() {
		// Change the value and disable animations in the same update:
		state = { value: 152, animated: false }
		await tick()
		;(el?.shadowRoot?.getAnimations() ?? []).forEach((a) => {
			a.pause()
			a.currentTime = 300
		})
	}
</script>

<div>
	<NumberFlow
		id="flow1"
		data-testid="flow1"
		bind:el
		value={state.value}
		animated={state.animated}
		transformTiming={{ easing: 'linear', duration: 500 }}
		spinTiming={{ easing: 'linear', duration: 800 }}
		opacityTiming={{ easing: 'linear', duration: 500 }}
	/>
</div>
<button on:click={change}>Change and pause</button>
