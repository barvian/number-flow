<script setup lang="ts">
import NumberFlow, { NumberFlowGroup } from '@number-flow/vue'
const { value, diff } = defineProps<{
	value: number
	diff: number
}>()
</script>

<template>
	<NumberFlowGroup>
		<div style="--number-flow-char-height: 0.85em" class="flex items-center gap-4 font-semibold">
			<NumberFlow :value :format="{ style: 'currency', currency: 'USD' }" class="~text-2xl/4xl" />
			<NumberFlow
				:value="diff"
				:format="{ style: 'percent', maximumFractionDigits: 2, signDisplay: 'always' }"
				:class="[
					'~text-lg/2xl transition-colors duration-300',
					diff < 0 ? 'text-red-500' : 'text-emerald-500'
				]"
			/>
		</div>
	</NumberFlowGroup>
</template>
