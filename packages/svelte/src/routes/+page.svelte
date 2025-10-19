<script lang="ts">
	import NumberFlow, { NumberFlowGroup, NumberFlowElement, continuous } from '$lib/index.js'

	const initialValue = 42

	let value = $state(initialValue)
	let el1: NumberFlowElement | undefined = $state()
	let el2: NumberFlowElement | undefined = $state()

	$effect(() => {
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
			id="flow1"
			{value}
			format={{ style: 'currency', currency: 'USD' }}
			locales="zh-CN"
			trend={() => -1}
			prefix=":"
			suffix="/mo"
			onanimationsstart={() => console.log('start')}
			onanimationsfinish={() => console.log('finish')}
			transformTiming={{ easing: 'linear', duration: 500 }}
			spinTiming={{ easing: 'linear', duration: 800 }}
			opacityTiming={{ easing: 'linear', duration: 500 }}
		/><NumberFlow
			bind:el={el2}
			id="flow2"
			{value}
			respectMotionPreference={false}
			plugins={[continuous]}
			digits={{ 0: { max: 2 } }}
			transformTiming={{ easing: 'linear', duration: 500 }}
			spinTiming={{ easing: 'linear', duration: 800 }}
			opacityTiming={{ easing: 'linear', duration: 500 }}
		/>
	</NumberFlowGroup>
</div>
<button onclick={() => (value = 152)}>Change and pause</button>
<br />
<button
	onclick={() => {
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
