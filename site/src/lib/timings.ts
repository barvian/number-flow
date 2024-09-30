import { toEase } from '@number-flow/react/framer-motion'
import type { EasingFunction } from 'framer-motion'

export const optimizeLinear = (linear: string, duration: number, fps: number = 60) => {
	const transformer = toEase(linear) as EasingFunction
	const frames = Math.ceil((duration * fps) / 1000)
	const points = Array.from({ length: frames }, (_, i) => {
		const t = i / (frames - 1)
		return `${parseFloat(transformer(t).toFixed(5))} ${parseFloat((t * 100).toFixed(5))}%`
	}).join(',')
	return `linear(${points})`
}
