<script lang="ts" context="module">
	import { NumberFlowLite, define, type PartitionedParts } from 'number-flow'
	// Svelte only supports setters, but Svelte 4 didn't pick up inherited ones:
	export class NumberFlowElement extends NumberFlowLite {
		set __svelte_manual(manual: boolean) {
			this.manual = manual
		}
		override set parts(parts: PartitionedParts | undefined) {
			super.parts = parts
		}
	}
	Object.keys(NumberFlowElement.defaultProps).forEach((key) => {
		Object.defineProperty(NumberFlowElement.prototype, `__svelte_${key}`, {
			set(value) {
				this[key] = value
			},
			enumerable: true,
			configurable: true
		})
	})

	define('number-flow-svelte', NumberFlowElement)
</script>

<script lang="ts">
	import {
		type Value,
		type Format,
		render as renderFlow,
		partitionParts,
		type Props as NumberFlowProps
	} from 'number-flow'
	import type { HTMLAttributes } from 'svelte/elements'
	import { writable } from 'svelte/store'
	import { getGroupContext } from './group.js'

	export let locales: Intl.LocalesArgument = undefined
	export let format: Format | undefined = undefined
	export let value: Value
	export let willChange = false

	// Define these so they can be remapped. We set them to their defaults because
	// that makes them optional in Svelte
	export let transformTiming = NumberFlowElement.defaultProps.transformTiming
	export let spinTiming = NumberFlowElement.defaultProps.spinTiming
	export let opacityTiming = NumberFlowElement.defaultProps.opacityTiming
	export let animated = NumberFlowElement.defaultProps.animated
	export let respectMotionPreference = NumberFlowElement.defaultProps.respectMotionPreference
	export let trend = NumberFlowElement.defaultProps.trend
	export let continuous = NumberFlowElement.defaultProps.continuous

	type $$Props = HTMLAttributes<HTMLElement> &
		Partial<NumberFlowProps> & {
			el?: NumberFlowElement
			locales?: Intl.LocalesArgument
			format?: Format
			value: Value
			willChange?: boolean
		}

	type $$Events = {
		animationsstart: CustomEvent<undefined>
		animationsfinish: CustomEvent<undefined>
	}

	export let el: NumberFlowElement | undefined = undefined
	const elStore = writable<NumberFlowElement | undefined>(el)
	$: $elStore = el

	// You're supposed to cache these between uses:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
	$: formatter = new Intl.NumberFormat(locales, format)
	$: parts = partitionParts(value, formatter)

	// Handle grouping. Keep as much logic in NumberFlowGroup.vue as possible
	// for better tree-shaking:
	const group = getGroupContext()
	group?.register?.(elStore)
</script>

<number-flow-svelte
	bind:this={el}
	{...$$restProps}
	data-will-change={willChange ? '' : undefined}
	on:animationsstart
	on:animationsfinish
	__svelte_manual={Boolean(group)}
	__svelte_transformTiming={transformTiming}
	__svelte_spinTiming={spinTiming}
	__svelte_opacityTiming={opacityTiming}
	__svelte_animated={animated}
	__svelte_respectMotionPreference={respectMotionPreference}
	__svelte_trend={trend}
	__svelte_continuous={continuous}
	{parts}
>
	{@html renderFlow({ formatted: parts.formatted, willChange })}
</number-flow-svelte>
