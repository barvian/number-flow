<script lang="ts">
	// Intentionally no <NumberFlowGroup>: updating any number of flows in the
	// same update should batch reads/writes without one.
	import NumberFlow, { type Format } from '$lib/index.js'
	import { onMount } from 'svelte'

	let value = 42
	let format: Format | undefined
	let suffix: string | undefined

	const change = () => {
		format = { style: 'currency', currency: 'USD' }
		suffix = '/mo'
		value = 1250.5
	}

	onMount(() => {
		// Exposed for the reflow test:
		;(window as unknown as { change: () => void }).change = change
	})
</script>

<NumberFlow data-testid="flow1" {value} {format} {suffix} /><NumberFlow
	data-testid="flow2"
	{value}
	{format}
	{suffix}
/>
<button on:click={change}>Change</button>
