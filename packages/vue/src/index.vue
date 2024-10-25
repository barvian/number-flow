<script lang="ts" setup>
import {
	type Value,
	type Format,
	render,
	partitionParts,
	NumberFlowLite,
	type Props as NumberFlowProps
} from 'number-flow'
import { computed, ref } from 'vue'

type Props = Partial<NumberFlowProps> & {
	locales?: Intl.LocalesArgument
	format?: Format
	value: Value
	willChange?: boolean
}

// This is repetitive but I couldn't get it any cleaner using `withDefaults`,
// because then you can't destructure,
// and if you don't set defaults Vue will use its own for i.e. booleans.
const {
	locales,
	format,
	value,
	trend = NumberFlowLite.defaultProps.trend,
	continuous = NumberFlowLite.defaultProps.continuous,
	animated = NumberFlowLite.defaultProps.animated,
	transformTiming = NumberFlowLite.defaultProps.transformTiming,
	spinTiming = NumberFlowLite.defaultProps.spinTiming,
	opacityTiming = NumberFlowLite.defaultProps.opacityTiming,
	respectMotionPreference = NumberFlowLite.defaultProps.respectMotionPreference,
	willChange = false
} = defineProps<Props>()

const el = ref<NumberFlowLite>()

defineExpose({ el })

defineOptions({
	inheritAttrs: false // set them manually to ensure `parts` updates last
})

// Technically the original animationsstart still emits but ah well:
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
		v-bind="$attrs"
		:trend
		:continuous
		:animated
		:transformTiming
		:spinTiming
		:opacityTiming
		:respectMotionPreference
		:data-will-change="willChange ? '' : undefined"
		v-html="render({ formatted: parts.formatted, willChange })"
		@animationsstart="emit('animationsStart')"
		@animationsfinish="emit('animationsFinish')"
		:parts
	/>
</template>
