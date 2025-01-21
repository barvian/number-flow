<script lang="ts">
	import NumberFlow, { NumberFlowGroup } from '@number-flow/svelte'
	import clsx from 'clsx/lite'

	const {
		value,
		diff
	}: {
		value: number
		diff: number
	} = $props()
</script>

<NumberFlowGroup>
	<div style="--number-flow-char-height: 0.85em" class="flex items-center gap-4 font-semibold">
		<NumberFlow
			{value}
			locales="en-US"
			format={{ style: 'currency', currency: 'USD' }}
			class="~text-2xl/4xl"
		/>
		<NumberFlow
			value={diff}
			locales="en-US"
			format={{ style: 'percent', maximumFractionDigits: 2, signDisplay: 'always' }}
			class={clsx(
				'~text-lg/2xl transition-colors duration-300',
				diff < 0 ? 'text-red-500' : 'text-emerald-500'
			)}
		/>
	</div>
</NumberFlowGroup>
