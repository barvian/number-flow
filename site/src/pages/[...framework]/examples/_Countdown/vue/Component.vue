<script setup lang="ts">
import NumberFlow, { NumberFlowGroup } from '@number-flow/vue'
import { computed } from 'vue'

const { seconds } = defineProps<{ seconds: number }>()

const hh = computed(() => Math.floor(seconds / 3600))
const mm = computed(() => Math.floor((seconds % 3600) / 60))
const ss = computed(() => seconds % 60)
</script>

<template>
	<NumberFlowGroup>
		<div
			style="font-variant-numeric: tabular-nums"
			class="~text-3xl/4xl flex items-baseline font-semibold"
		>
			<NumberFlow :trend="-1" :value="hh" :format="{ minimumIntegerDigits: 2 }" />
			<NumberFlow
				prefix=":"
				:trend="-1"
				:value="mm"
				:digits="{ 1: { max: 5 } }"
				:format="{ minimumIntegerDigits: 2 }"
			/>
			<NumberFlow
				prefix=":"
				:trend="-1"
				:value="ss"
				:digits="{ 1: { max: 5 } }"
				:format="{ minimumIntegerDigits: 2 }"
			/>
		</div>
	</NumberFlowGroup>
</template>
