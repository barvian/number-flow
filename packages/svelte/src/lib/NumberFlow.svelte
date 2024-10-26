<script lang="ts">
	import {
		type Value,
		type Format,
		render as renderFlow,
		partitionParts,
		NumberFlowLite,
		type Props as NumberFlowProps
	} from 'number-flow'
	import type { HTMLAttributes } from 'svelte/elements'

	export let locales: Intl.LocalesArgument = undefined
	export let format: Format | undefined = undefined
	export let value: Value
	export let willChange = false

	// Svelte only supports setters, not properties, so we can't use $$restProps
	// because we have to remap them::
	export let trend = NumberFlowLite.defaultProps.trend
	export let continuous = NumberFlowLite.defaultProps.continuous
	export let animated = NumberFlowLite.defaultProps.animated
	export let transformTiming = NumberFlowLite.defaultProps.transformTiming
	export let spinTiming = NumberFlowLite.defaultProps.spinTiming
	export let opacityTiming = NumberFlowLite.defaultProps.opacityTiming
	export let respectMotionPreference = NumberFlowLite.defaultProps.respectMotionPreference

	type $$Props = HTMLAttributes<HTMLElement> &
		Partial<NumberFlowProps> & {
			el?: NumberFlowLite
			locales?: Intl.LocalesArgument
			format?: Format
			value: Value
			willChange?: boolean
		}

	type $$Events = {
		animationsstart: CustomEvent<undefined>
		animationsfinish: CustomEvent<undefined>
	}

	export let el: NumberFlowLite | undefined = undefined

	// You're supposed to cache these between uses:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
	$: formatter = new Intl.NumberFormat(locales, format)
	$: parts = partitionParts(value, formatter)
</script>

<number-flow-svelte
	bind:this={el}
	{...$$restProps}
	data-will-change={willChange ? '' : undefined}
	__trend={trend}
	__continuous={continuous}
	__animated={animated}
	__transformTiming={transformTiming}
	__spinTiming={spinTiming}
	__opacityTiming={opacityTiming}
	__respectMotionPreference={respectMotionPreference}
	on:animationsstart
	on:animationsfinish
	{parts}
>
	{@html renderFlow({ formatted: parts.formatted, willChange })}
</number-flow-svelte>
