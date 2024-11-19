<script lang="ts" setup>
import {
	type Value,
	type Format,
	renderInnerHTML,
	formatToData,
	NumberFlowLite,
	type Props as NumberFlowProps
} from 'number-flow'
import { computed, inject, ref, watch } from 'vue'
import { key as groupKey } from './group'
import { BROWSER } from 'esm-env'

type Props = Partial<NumberFlowProps> & {
	locales?: Intl.LocalesArgument
	format?: Format
	value: Value
	prefix?: string
	suffix?: string
	willChange?: boolean
}

// This is repetitive but I couldn't get it any cleaner using `withDefaults`,
// because then you can't destructure,
// and if you don't set defaults Vue will use its own for e.g. booleans.
const {
	locales,
	format,
	value,
	prefix,
	suffix,
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

const emit = defineEmits<{
	(e: 'animationsstart'): void
	(e: 'animationsfinish'): void
}>()

// You're supposed to cache these between uses:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
const formatter = computed(() => new Intl.NumberFormat(locales, format))
const data = computed(() => formatToData(value, formatter.value, prefix, suffix))

// Putting this in the v-html attribute ruined tree-shaking
const html = BROWSER ? undefined : renderInnerHTML(data.value)

// Handle grouping. Keep as much logic in NumberFlowGroup.vue as possible
// for better tree-shaking:
const register = inject(groupKey, undefined)
register?.(el, data)
</script>
<template>
	<!-- Make sure data is set last: -->
	<number-flow-vue
		ref="el"
		:aria-label="data.valueAsString"
		v-bind="$attrs"
		role="img"
		:manual="Boolean(register)"
		:trend
		:continuous
		:animated
		:transformTiming
		:spinTiming
		:opacityTiming
		:respectMotionPreference
		:data-will-change="willChange ? '' : undefined"
		v-html="html"
		data-allow-mismatch
		@animationsstart="emit('animationsstart')"
		@animationsfinish="emit('animationsfinish')"
		:data
	/>
</template>
