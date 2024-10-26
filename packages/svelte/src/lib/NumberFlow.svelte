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

type $$Props = HTMLAttributes<HTMLElement> & Partial<NumberFlowProps> & {
	el?: NumberFlowLite
	locales?: Intl.LocalesArgument
	format?: Format
	value: Value
	willChange?: boolean
}

type $$Events = {
	animationsstart: CustomEvent<undefined>,
	animationsfinish: CustomEvent<undefined>
}

export let el: NumberFlowLite | undefined = undefined

// You're supposed to cache these between uses:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
$: formatter = new Intl.NumberFormat(locales, format)
$: parts = partitionParts(value, formatter)
</script>

<number-flow bind:this={el} {...$$restProps} data-will-change={willChange ? '' : undefined} on:animationsstart on:animationsfinish {parts}>
	{@html renderFlow({ formatted: parts.formatted, willChange })}
</number-flow>