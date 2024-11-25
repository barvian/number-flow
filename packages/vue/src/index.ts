import { computed, onMounted, ref, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'
import {
	NumberFlowLite as NumberFlowElement,
	canAnimate as _canAnimate,
	define,
	prefersReducedMotion
} from 'number-flow'

export { default as NumberFlowGroup } from './NumberFlowGroup.vue'

export type { Value, Format, Trend } from 'number-flow'
export { NumberFlowElement }

// In case we ever need a subclass:
define('number-flow-vue', NumberFlowElement)

export { default } from './index.vue'

// SSR-safe canAnimate
export function useCanAnimate({
	respectMotionPreference = true
}: {
	respectMotionPreference?: MaybeRefOrGetter<boolean>
} = {}) {
	const canAnimate = ref(false)
	const reducedMotion = ref(false)

	// Handle SSR:
	onMounted(() => {
		canAnimate.value = _canAnimate
		reducedMotion.value = prefersReducedMotion?.matches ?? false
	})

	// Listen for reduced motion changes if needed:
	watchEffect((onCleanup) => {
		if (!toValue(respectMotionPreference)) return
		const onChange = ({ matches }: MediaQueryListEvent) => {
			reducedMotion.value = matches
		}
		prefersReducedMotion?.addEventListener('change', onChange)
		onCleanup(() => {
			prefersReducedMotion?.removeEventListener('change', onChange)
		})
	})

	return computed(
		() => canAnimate.value && (!toValue(respectMotionPreference) || !reducedMotion.value)
	)
}
