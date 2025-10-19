<script lang="ts">
	import NumberFlow, { NumberFlowGroup, NumberFlowElement } from '$lib/index.js'
	import { afterUpdate, tick } from 'svelte'

	const initialValue = 42

	let value = initialValue
	let el1: NumberFlowElement | undefined
	let el2: NumberFlowElement | undefined

	afterUpdate(async () => {
		await tick()
		if (value !== initialValue) {
			;[
				...(el1?.shadowRoot?.getAnimations() ?? []),
				...(el2?.shadowRoot?.getAnimations() ?? [])
			].forEach((a) => {
				a.pause()
				a.currentTime = 300
			})
		}
	})
</script>

<div>
	<NumberFlowGroup>
		<NumberFlow bind:el={el1} {value} /><NumberFlow bind:el={el2} value={0} />
	</NumberFlowGroup>
</div>
<button onclick={() => (value = 152000)}>Change and pause</button>
<br />
<button
	onclick={() => {
		;[
			...(el1?.shadowRoot?.getAnimations() ?? []),
			...(el2?.shadowRoot?.getAnimations() ?? [])
		].forEach((a) => {
			a.play()
		})
	}}
>
	Resume
</button>
