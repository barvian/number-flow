<script lang="ts" setup>
import { useCanAnimate } from '@number-flow/vue'

const canAnimate = useCanAnimate()
const disrespectMotionPreference = useCanAnimate({ respectMotionPreference: false })
</script>
<template>
	<div>
		<p data-testid="default">{{ String(canAnimate) }}</p>
		<p data-testid="disrespect-motion-preference">{{ String(disrespectMotionPreference) }}</p>
	</div>
</template>
