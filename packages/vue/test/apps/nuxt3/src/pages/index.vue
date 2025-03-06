<script setup lang="ts">
import NumberFlow, { NumberFlowGroup, continuous } from '@number-flow/vue'
import { nextTick, ref, useTemplateRef, watch } from 'vue'

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
				id="flow1"
				data-testid="flow1"
				ref="flow1"
				:value
				:format="{ style: 'currency', currency: 'USD' }"
				locales="zh-CN"
				:trend="() => -1"
				prefix=":"
				suffix="/mo"
				@animationsstart="handleStart"
				@animationsfinish="handleFinish"
				:transformTiming="{ easing: 'linear', duration: 500 }"
				:spinTiming="{ easing: 'linear', duration: 800 }"
				:opacityTiming="{ easing: 'linear', duration: 500 }"
			/>
			<NumberFlow
				id="flow2"
				data-testid="flow2"
				ref="flow2"
				:value
				:respectMotionPreference="false"
				:plugins="[continuous]"
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
