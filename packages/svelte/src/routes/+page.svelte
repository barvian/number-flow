<script lang="ts">
	import NumberFlow, { NumberFlowElement } from '$lib/index.js'
	import { afterUpdate } from 'svelte'

	const initialValue = 42

	let value = initialValue
	let el: NumberFlowElement | undefined

	afterUpdate(() => {
		if (value !== initialValue) {
			el?.shadowRoot?.getAnimations().forEach((a) => {
				a.pause()
				a.currentTime = 300
			})
		}
	})
</script>

<div>
	Text node
	<NumberFlow
		bind:el
		{value}
		format={{ style: 'currency', currency: 'USD' }}
		locales="zh-CN"
		trend={() => +1}
		prefix=":"
		suffix="/mo"
		data-testid="flow"
		continuous
		on:animationsstart={() => console.log('start')}
		on:animationsfinish={() => console.log('finish')}
		transformTiming={{ easing: 'linear', duration: 500 }}
		spinTiming={{ easing: 'linear', duration: 800 }}
		opacityTiming={{ easing: 'linear', duration: 500 }}
	/>
</div>
<button on:click={() => (value = 152)}>Change and pause</button>
<br />
<button
	on:click={() => {
		el?.shadowRoot?.getAnimations().forEach((a) => {
			a.play()
		})
	}}
>
	Resume
</button>
