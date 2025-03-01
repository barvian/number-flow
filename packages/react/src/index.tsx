import * as React from 'react'
import {
	prefersReducedMotion as _prefersReducedMotion,
	canAnimate as _canAnimate
} from 'number-flow/lite'
export * from 'number-flow/plugins'
export { default } from './NumberFlow'
export * from './NumberFlow'
export type { Value, Format, Trend, NumberPartType } from 'number-flow/lite'

export const useIsSupported = () =>
	React.useSyncExternalStore(
		() => () => {}, // this value doesn't change, but it's useful to specify a different SSR value:
		() => _canAnimate,
		() => false
	)
export const usePrefersReducedMotion = () =>
	React.useSyncExternalStore(
		(cb) => {
			_prefersReducedMotion?.addEventListener('change', cb)
			return () => _prefersReducedMotion?.removeEventListener('change', cb)
		},
		() => _prefersReducedMotion!.matches,
		() => false
	)

export function useCanAnimate({ respectMotionPreference = true } = {}) {
	const isSupported = useIsSupported()
	const reducedMotion = usePrefersReducedMotion()

	return isSupported && (!respectMotionPreference || !reducedMotion)
}
