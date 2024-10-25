import { computed, onMounted, ref, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'
import { NumberFlowLite, canAnimate as _canAnimate, prefersReducedMotion } from 'number-flow'
export type { Value, Format, Trend } from 'number-flow'

NumberFlowLite.define()

export { default } from './index.vue'

// SSR-safe canAnimate
export function useCanAnimate({
	respectMotionPreference = true
}: {
	respectMotionPreference?: MaybeRefOrGetter<boolean>
} = {}) {
	const canAnimate = ref(_canAnimate)
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
