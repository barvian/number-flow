<script lang="ts">
	import { getCanAnimate } from '$lib/index.js'
	const canAnimate = getCanAnimate()
	const disrespectMotionPreference = getCanAnimate({ respectMotionPreference: false })

	// Trigger runes mode:
	$: $canAnimate
</script>

<div>
	<p data-testid="default">{String($canAnimate)}</p>
	<p data-testid="disrespect-motion-preference">{String($disrespectMotionPreference)}</p>
</div>
