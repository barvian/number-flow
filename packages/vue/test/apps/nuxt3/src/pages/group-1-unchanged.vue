<script setup lang="ts">
import NumberFlow, { NumberFlowGroup } from '@number-flow/vue'
import { ref } from 'vue'

const flow1 = useTemplateRef('flow1')
const flow2 = useTemplateRef('flow2')
const value = ref(42)
watch(
	value,
	async () => {
		await nextTick()
		;[
			...(flow1.value?.el?.shadowRoot?.getAnimations() ?? []),
			...(flow2.value?.el?.shadowRoot?.getAnimations() ?? [])
		].forEach((a) => {
			a.pause()
			a.currentTime = 300
		})
	},
	{ flush: 'post' }
)
</script>
<template>
	<div>
		<NumberFlowGroup>
			<NumberFlow ref="flow1" :value />
			<NumberFlow ref="flow2" :value="0" />
		</NumberFlowGroup>
	</div>
	<button @click="value = 152000">Change and pause</button><br />
	<button
		@click="
			() => {
				;[
					...(flow1?.el?.shadowRoot?.getAnimations() ?? []),
					...(flow2?.el?.shadowRoot?.getAnimations() ?? [])
				].forEach((a) => {
					a.play()
				})
			}
		"
	>
		Resume
	</button>
</template>
