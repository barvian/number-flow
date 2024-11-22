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

const handleStart = () => console.log('start')
const handleFinish = () => console.log('finish')
</script>
<template>
	<div>
		Text node
		<NumberFlowGroup>
			<NumberFlow
				ref="flow1"
				:value
				:format="{ style: 'currency', currency: 'USD' }"
				locales="zh-CN"
				:trend="() => -1"
				prefix=":"
				suffix="/mo"
				data-testid="flow1"
				@animationsstart="handleStart"
				@animationsfinish="handleFinish"
				:transformTiming="{ easing: 'linear', duration: 500 }"
				:spinTiming="{ easing: 'linear', duration: 800 }"
				:opacityTiming="{ easing: 'linear', duration: 500 }"
			/>
			<NumberFlow
				ref="flow2"
				:value
				:respectMotionPreference="false"
				data-testid="flow2"
				continuous
				:digits="{ 0: { max: 2 } }"
				:transformTiming="{ easing: 'linear', duration: 500 }"
				:spinTiming="{ easing: 'linear', duration: 800 }"
				:opacityTiming="{ easing: 'linear', duration: 500 }"
			/>
		</NumberFlowGroup>
	</div>
	<button @click="value = 152">Change and pause</button><br />
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
