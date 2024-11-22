<script lang="ts">
	import NumberFlow, { NumberFlowGroup, NumberFlowElement } from '$lib/index.js'
	import { afterUpdate, tick } from 'svelte'

	const initialValue = 42

	let value = initialValue
	let el1: NumberFlowElement | undefined
	let el2: NumberFlowElement | undefined

	afterUpdate(async () => {
		await tick()
		if (value !== initialValue) {
			;[
				...(el1?.shadowRoot?.getAnimations() ?? []),
				...(el2?.shadowRoot?.getAnimations() ?? [])
			].forEach((a) => {
				a.pause()
				a.currentTime = 300
			})
		}
	})
</script>

<div>
	Text node
	<NumberFlowGroup>
		<NumberFlow
			bind:el={el1}
			{value}
			format={{ style: 'currency', currency: 'USD' }}
			locales="zh-CN"
			trend={() => -1}
			prefix=":"
			suffix="/mo"
			data-testid="flow1"
			on:animationsstart={() => console.log('start')}
			on:animationsfinish={() => console.log('finish')}
			transformTiming={{ easing: 'linear', duration: 500 }}
			spinTiming={{ easing: 'linear', duration: 800 }}
			opacityTiming={{ easing: 'linear', duration: 500 }}
		/><NumberFlow
			bind:el={el2}
			{value}
			respectMotionPreference={false}
			data-testid="flow2"
			continuous
			digits={{ 0: { max: 2 } }}
			transformTiming={{ easing: 'linear', duration: 500 }}
			spinTiming={{ easing: 'linear', duration: 800 }}
			opacityTiming={{ easing: 'linear', duration: 500 }}
		/>
	</NumberFlowGroup>
</div>
<button on:click={() => (value = 152)}>Change and pause</button>
<br />
<button
	on:click={() => {
		;[
			...(el1?.shadowRoot?.getAnimations() ?? []),
			...(el2?.shadowRoot?.getAnimations() ?? [])
		].forEach((a) => {
			a.play()
		})
	}}
>
	Resume
</button>
