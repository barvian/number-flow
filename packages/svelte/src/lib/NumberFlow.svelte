<script lang="ts" context="module">
	import { NumberFlowLite, define, type PartitionedParts } from 'number-flow'
	// Svelte 4 seems to check setters, but not on the prototype:
	export class NumberFlowSvelte extends NumberFlowLite {
		override set parts(parts: PartitionedParts | undefined) {
			super.parts = parts
		}
		override set animated(val: boolean) {
			super.animated = val
		}
	}
	Object.keys(NumberFlowSvelte.defaultProps).forEach((key) => {
		Object.defineProperty(NumberFlowSvelte.prototype, `__svelte_${key}`, {
			set(value) {
				this[key] = value
			},
			enumerable: true,
			configurable: true
		})
	})

	define('number-flow-svelte', NumberFlowSvelte)
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

	export let locales: Intl.LocalesArgument = undefined
	export let format: Format | undefined = undefined
	export let value: Value
	export let willChange = false

	type $$Props = HTMLAttributes<HTMLElement> &
		Partial<NumberFlowProps> & {
			el?: NumberFlowSvelte
			locales?: Intl.LocalesArgument
			format?: Format
			value: Value
			willChange?: boolean
		}

	type $$Events = {
		animationsstart: CustomEvent<undefined>
		animationsfinish: CustomEvent<undefined>
	}

	export let el: NumberFlowSvelte | undefined = undefined

	// You're supposed to cache these between uses:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
	$: formatter = new Intl.NumberFormat(locales, format)
	$: parts = partitionParts(value, formatter)

	// Svelte only supports setters, not properties, so remap them:
	$: rest = Object.fromEntries(
		Object.entries($$restProps).map(([key, value]) =>
			key in NumberFlowSvelte.defaultProps ? [`__svelte_${key}`, value] : [key, value]
		)
	)
</script>

<number-flow-svelte
	bind:this={el}
	{...rest}
	data-will-change={willChange ? '' : undefined}
	on:animationsstart
	on:animationsfinish
	{parts}
>
	{@html renderFlow({ formatted: parts.formatted, willChange })}
</number-flow-svelte>
