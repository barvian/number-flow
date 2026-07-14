<script setup lang="ts">
// Cycles through formats that add, remove, then re-add symbols
// (accounting parens, currency, signs):
import NumberFlow, { type Format } from '@number-flow/vue'
import { computed, nextTick, ref, watch, useTemplateRef } from 'vue'

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

const flow = useTemplateRef('flow')
const i = ref(0)
const value = computed(() => CYCLE[i.value % CYCLE.length]![0])
const format = computed(() => CYCLE[i.value % CYCLE.length]![1])

watch(
	i,
	async () => {
		await nextTick()
		flow.value?.el?.shadowRoot?.getAnimations().forEach((a) => {
			// Leave previously-paused rounds where they are:
			if (a.playState === 'paused') return
			a.pause()
			a.currentTime = PAUSES[(i.value - 1) % PAUSES.length]!
		})
	},
	{ flush: 'post' }
)
</script>
<template>
	<button @click="i++">Cycle and pause</button>
	<div>
		Text node
		<NumberFlow
			ref="flow"
			:value
			:format
			:transformTiming="{ duration: 900, easing: `linear` }"
			:opacityTiming="{ duration: 900, easing: `linear` }"
		/>
	</div>
</template>
