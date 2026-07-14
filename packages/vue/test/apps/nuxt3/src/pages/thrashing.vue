<script setup lang="ts">
// Intentionally no <NumberFlowGroup>: updating any number of flows in the
// same update should batch reads/writes without one.
import NumberFlow, { type Format } from '@number-flow/vue'
import { onMounted, ref } from 'vue'

const value = ref(42)
const format = ref<Format>()
const suffix = ref<string>()

const change = () => {
	format.value = { style: 'currency', currency: 'USD' }
	suffix.value = '/mo'
	value.value = 1250.5
}

onMounted(() => {
	// Exposed for the reflow test:
	;(window as unknown as { change: () => void }).change = change
})
</script>
<template>
	<NumberFlow data-testid="flow1" :value :format :suffix /><NumberFlow
		data-testid="flow2"
		:value
		:format
		:suffix
	/>
	<button @click="change">Change</button>
</template>
