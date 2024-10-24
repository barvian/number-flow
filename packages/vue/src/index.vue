<script lang="ts" setup>
import {
	type Value,
	type Props as NumberFlowProps,
	type Format,
	render,
	partitionParts,
	NumberFlowLite
} from 'number-flow'
import { computed, ref } from 'vue'

type Props = {
	locales?: Intl.LocalesArgument
	format?: Format
	value: Value
	willChange?: boolean
} & Partial<NumberFlowProps>

const { locales, format, value, willChange, ...props } = defineProps<Props>()

const el = ref<NumberFlowLite>()

defineExpose({ el })

const emit = defineEmits<{
	(e: 'animationsStart'): void
	(e: 'animationsFinish'): void
}>()

// You're supposed to cache these between uses:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
const formatter = computed(() => new Intl.NumberFormat(locales, format))

const parts = computed(() => partitionParts(value, formatter.value))

// Pre effects don't seem to batch to handle grouping like React:
// https://discord.com/channels/325477692906536972/1299071468533055541
//
// watch(
// 	[parts, () => isolate],
// 	([_, isolate]) => {
// 		if (!isolate) el.value?.willUpdate()
// 	},
// 	{ flush: 'pre' }
// )
// watch(
// 	[parts, () => isolate],
// 	([_, isolate]) => {
// 		if (!isolate) el.value?.didUpdate()
// 	},
// 	{ flush: 'post' }
// )
</script>
<template>
	<!-- Make sure parts is set last: -->
	<number-flow
		ref="el"
		v-bind="props"
		:data-will-change="willChange ? '' : undefined"
		v-html="render({ formatted: parts.formatted, willChange })"
		@animationsstart="emit('animationsStart')"
		@animationsfinish="emit('animationsFinish')"
		:parts
	/>
</template>
