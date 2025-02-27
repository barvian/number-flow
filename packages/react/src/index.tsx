import * as React from 'react'
import {
	prefersReducedMotion as _prefersReducedMotion,
	canAnimate as _canAnimate
} from 'number-flow'
export * from 'number-flow/plugins'
export { default } from './NumberFlow'
export * from './NumberFlow'
export type { Value, Format, Trend, NumberPartType } from 'number-flow'

export const useIsSupported = () => {
	return _canAnimate
}

export const usePrefersReducedMotion = () => {
	const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(_prefersReducedMotion!.matches)

	React.useEffect(() => {
		const cb = () => setPrefersReducedMotion(_prefersReducedMotion!.matches)
		_prefersReducedMotion?.addEventListener('change', cb)
		return () => _prefersReducedMotion?.removeEventListener('change', cb)
	}, [])

	return prefersReducedMotion
}

export function useCanAnimate({ respectMotionPreference = true } = {}) {
	const isSupported = useIsSupported()
	const reducedMotion = usePrefersReducedMotion()

	return isSupported && (!respectMotionPreference || !reducedMotion)
}
