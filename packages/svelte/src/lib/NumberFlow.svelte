<script lang="ts" context="module">
	import NumberFlowLite, { define, type Data } from 'number-flow/lite'
	// Svelte only supports setters, but Svelte 4 didn't pick up inherited ones:
	export class NumberFlowElement extends NumberFlowLite {
		set __svelte_batched(batched: boolean) {
			this.batched = batched
		}
		override set data(data: Data | undefined) {
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
		type Props as NumberFlowProps
	} from 'number-flow/lite'
	import type { HTMLAttributes } from 'svelte/elements'
	import { writable } from 'svelte/store'
	import { getGroupContext } from './group.js'
	import { BROWSER } from 'esm-env'

	export let locales: Intl.LocalesArgument = undefined
	export let format: Format | undefined = undefined
	export let value: Value
	export let prefix: string | undefined = undefined
	export let suffix: string | undefined = undefined
	export let willChange = false

	// Define these so they can be remapped. We set them to their defaults because
	// that makes them optional in Svelte
	export let transformTiming = NumberFlowElement.defaultProps.transformTiming
	export let spinTiming = NumberFlowElement.defaultProps.spinTiming
	export let opacityTiming = NumberFlowElement.defaultProps.opacityTiming
	export let animated = NumberFlowElement.defaultProps.animated
	export let respectMotionPreference = NumberFlowElement.defaultProps.respectMotionPreference
	export let trend = NumberFlowElement.defaultProps.trend
	export let plugins = NumberFlowElement.defaultProps.plugins
	export let digits = NumberFlowElement.defaultProps.digits

	type $$Props = HTMLAttributes<HTMLElement> &
		Partial<NumberFlowProps> & {
			el?: NumberFlowElement
			locales?: Intl.LocalesArgument
			format?: Format
			value: Value
			prefix?: string
			suffix?: string
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
	$: data = formatToData(value, formatter, prefix, suffix)

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
>
	{@html BROWSER ? undefined : renderInnerHTML(data)}
</number-flow-svelte>
