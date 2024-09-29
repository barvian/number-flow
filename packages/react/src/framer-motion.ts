import {
	supportsLinear,
	defaultXTimingFallbackPoints,
	defaultXTimingFallbackDuration,
	defaultXTimingLinearDuration,
	defaultXTimingLinearPoints
} from 'number-flow'
import { transform, type Transition } from 'framer-motion'

// Convenience for Framer Motion:
const defaultTransformer = transform(
	defaultXTimingLinearPoints.map((_, i) => i / (defaultXTimingLinearPoints.length - 1)),
	defaultXTimingLinearPoints
)
export const defaultLayoutTransition: Transition = supportsLinear
	? {
			duration: defaultXTimingLinearDuration / 1000,
			ease: defaultTransformer
		}
	: {
			duration: defaultXTimingFallbackDuration / 1000,
			easing: defaultXTimingFallbackPoints
		}
