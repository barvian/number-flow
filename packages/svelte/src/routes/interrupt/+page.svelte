<script lang="ts">
	// Cycles through formats that add, remove, then re-add symbols
	// (accounting parens, currency, signs):
	import NumberFlow, { NumberFlowElement, type Format } from '$lib/index.js'
	import { afterUpdate, tick } from 'svelte'

	const CYCLE: [number, Format][] = [
		[431.1, { minimumFractionDigits: 2 }],
		[
			-3243.6,
			{ style: 'currency', currency: 'USD', currencySign: 'accounting', signDisplay: 'always' }
		],
		// Swaps the parens/currency for a minus sign (and back), so symbols
		// get added and removed in the same section simultaneously:
		[-3243.5, {}],
		[
			-3243.6,
			{ style: 'currency', currency: 'USD', currencySign: 'accounting', signDisplay: 'always' }
		]
	]

	// Per-click pause times: pause the pops late (so mispositioned exiting
	// symbols would have visibly drifted), then the reclaims early (so
	// they'd render at the drifted positions):
	const PAUSES = [900, 900, 450]

	let i = 0
	let el: NumberFlowElement | undefined
	$: [value, format] = CYCLE[i % CYCLE.length]!

	afterUpdate(async () => {
		await tick()
		if (i > 0) {
			el?.shadowRoot?.getAnimations().forEach((a) => {
				// Leave previously-paused rounds where they are:
				if (a.playState === 'paused') return
				a.pause()
				a.currentTime = PAUSES[(i - 1) % PAUSES.length]!
			})
		}
	})
</script>

<button on:click={() => i++}>Cycle and pause</button>
<div>
	Text node <NumberFlow
		bind:el
		{value}
		{format}
		transformTiming={{ duration: 900, easing: 'linear' }}
		opacityTiming={{ duration: 900, easing: 'linear' }}
	/>
</div>
