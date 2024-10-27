<script lang="ts" context="module">
	import { NumberFlowLite, define, type PartitionedParts } from 'number-flow'
	// Svelte only supports setters, and Svelte 4 doesn't seem to check the prototype:
	export class NumberFlowElement extends NumberFlowLite {
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

	export let locales: Intl.LocalesArgument = undefined
	export let format: Format | undefined = undefined
	export let value: Value
	export let willChange = false

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

	// You're supposed to cache these between uses:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
	$: formatter = new Intl.NumberFormat(locales, format)
	$: parts = partitionParts(value, formatter)

	// Svelte only supports setters, not properties, so remap them:
	$: rest = Object.fromEntries(
		Object.entries($$restProps).map(([key, value]) =>
			key in NumberFlowElement.defaultProps ? [`__svelte_${key}`, value] : [key, value]
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
