import { spring as motionSpring } from 'motion'

export const spring = (...args: Parameters<typeof motionSpring>) => {
	const string = motionSpring(...args).toString()
	const [, duration, easing] = string.match(/^(.*?ms)\s(.*)$/)!
	return {
		duration: parseFloat(duration!),
		easing,
		toString() {
			return string
		}
	}
}
