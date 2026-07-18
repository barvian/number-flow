<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
import { nextTick, ref, useTemplateRef } from 'vue'

const flow = useTemplateRef('flow')
const state = ref({ value: 42, animated: true })

function change() {
	// Change the value and disable animations in the same update:
	state.value = { value: 152, animated: false }
	nextTick(() => {
		;(flow.value?.el?.shadowRoot?.getAnimations() ?? []).forEach((a) => {
			a.pause()
			a.currentTime = 300
		})
	})
}
</script>
<template>
	<div>
		<NumberFlow
			id="flow1"
			data-testid="flow1"
			ref="flow"
			:value="state.value"
			:animated="state.animated"
			:transformTiming="{ easing: 'linear', duration: 500 }"
			:spinTiming="{ easing: 'linear', duration: 800 }"
			:opacityTiming="{ easing: 'linear', duration: 500 }"
		/>
	</div>
	<button @click="change">Change and pause</button>
</template>
