<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
const { value, diff } = defineProps<{
	value: number
	diff: number
}>()
</script>

<template>
	<div
		style="--number-flow-char-height: 0.85em"
		class="~text-xl/4xl flex items-center gap-2 font-semibold"
	>
		<NumberFlow :value :format="{ style: 'currency', currency: 'USD' }" />
		<NumberFlow :value="diff" :format="{ style: 'percent', maximumFractionDigits: 2 }" />
	</div>
</template>
