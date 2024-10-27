<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
import { ref } from 'vue'

const flow = useTemplateRef('flow')
const value = ref(42)
watch(
	value,
	() => {
		flow.value?.el?.shadowRoot?.getAnimations().forEach((a) => {
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
		<NumberFlow
			ref="flow"
			:value
			:format="{ style: 'currency', currency: 'USD' }"
			locales="fr-FR"
			trend="increasing"
			continuous
			@animationsstart="handleStart"
			@animationsfinish="handleFinish"
			:transformTiming="{ easing: 'linear', duration: 500 }"
			:spinTiming="{ easing: 'linear', duration: 800 }"
			:opacityTiming="{ easing: 'linear', duration: 500 }"
		/>
	</div>
	<button @click="value = 152">Change and pause</button><br />
	<button
		@click="
			() => {
				flow?.el?.shadowRoot?.getAnimations().forEach((a) => {
					a.play()
				})
			}
		"
	>
		Resume
	</button>
</template>
