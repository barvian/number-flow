<script lang="ts" module>
	import NumberFlowLite, { define, type Data } from 'number-flow/lite'
	// Svelte only supports setters, but Svelte 4 didn't pick up inherited ones:

	export class NumberFlowElement extends NumberFlowLite {
		set __svelte_batched(batched: boolean) {
			this.batched = batched
		}
		set data(data: Data | undefined) {
			super.data = data
		}
	}
	Object.keys(NumberFlowElement.defaultProps).forEach((key) => {
		// Use lowerCase for Svelte 5 for some reason:
		Object.defineProperty(NumberFlowElement.prototype, `__svelte_${key.toLowerCase()}`, {
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
		renderInnerHTML,
		formatToData,
		type Props
	} from 'number-flow/lite'
	import { getGroupContext } from './group'
	import { BROWSER } from 'esm-env'
	import { writable } from 'svelte/store'

	interface NumberFlowProps extends Props {
		locales: Intl.LocalesArgument
		value: Value
		format?: Format
		prefix?: string
		suffix?: string
		willChange: boolean
		el: NumberFlowElement | undefined
	}

	let {
		locales = undefined,
		format = undefined,
		value,
		prefix = undefined,
		suffix = undefined,
		willChange = false,
		transformTiming = NumberFlowElement.defaultProps.transformTiming,
		spinTiming = NumberFlowElement.defaultProps.spinTiming,
		opacityTiming = NumberFlowElement.defaultProps.opacityTiming,
		animated = NumberFlowElement.defaultProps.animated,
		respectMotionPreference = NumberFlowElement.defaultProps.respectMotionPreference,
		trend = NumberFlowElement.defaultProps.trend,
		plugins = NumberFlowElement.defaultProps.plugins,
		digits = NumberFlowElement.defaultProps.digits,
		el = $bindable<NumberFlowElement | undefined>(),
		...restProps
	}: NumberFlowProps = $props()

	let elStore = writable<NumberFlowElement | undefined>(el)
	const group = getGroupContext()

	$effect(() => {
		elStore = writable<NumberFlowElement | undefined>(el)
		group?.register?.(elStore)
	})

	let formatter = $derived(new Intl.NumberFormat(locales, format))
	let data = $derived(formatToData(value, formatter, prefix, suffix))
</script>

<number-flow-svelte
	bind:this={el}
	data-will-change={willChange ? '' : undefined}
	__svelte_batched={Boolean(group)}
	__svelte_transformtiming={transformTiming}
	__svelte_spintiming={spinTiming}
	__svelte_opacitytiming={opacityTiming}
	__svelte_animated={animated}
	__svelte_respectmotionpreference={respectMotionPreference}
	__svelte_trend={trend}
	__svelte_plugins={plugins}
	__svelte_digits={digits}
	{data}
	{...restProps}
>
	{@html BROWSER ? undefined : renderInnerHTML(data)}
</number-flow-svelte>
