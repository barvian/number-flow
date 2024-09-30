import * as React from 'react'
import { transform, type BezierDefinition, type Easing, type Transition } from 'framer-motion'

const bezierRegExp = /^cubic-bezier\((.*?),(.*?),(.*?),(.*?)\)$/
const linearRegExp = /^linear\((.*?)\)$/

export function toEase(_easing: string): Easing {
	const easing = _easing.trim()

	if (easing === 'linear') return easing
	if (easing === 'ease-in') return 'easeIn'
	if (easing === 'ease-out') return 'easeOut'
	if (easing === 'ease-in-out') return 'easeInOut'

	const bezierMatch = easing.match(bezierRegExp)
	if (bezierMatch) {
		return bezierMatch.slice(1).map(parseFloat) as BezierDefinition
	}

	// Pretty rough but I don't want to blow up the bundle.
	// Should handle linear(x,x,x,x) and linear(x y%, x y%, x y%, x y%)
	// but not i.e. linear(x, x y%)
	const linearMatch = easing.match(linearRegExp)
	const linearExpr = linearMatch?.[1]
	if (linearExpr) {
		const points = linearExpr.split(',')
		const times: number[] = []
		const values: number[] = []
		try {
			points.forEach((point, i) => {
				const [p1, p2] = point.trim().split(/\s+/)

				if (p1?.includes('%')) {
					times.push(parseFloat(p1) / 100)
					values.push(parseFloat(p2!))
				} else if (p2?.includes('%')) {
					times.push(parseFloat(p2) / 100)
					values.push(parseFloat(p1!))
				} else {
					times.push(i / (points.length - 1))
					values.push(parseFloat(p1!))
				}
			})
		} catch {
			throw new Error(`Cannot parse linear() expression: ${easing}`)
		}
		return transform(times, values)
	}

	throw new Error(`Cannot convert ${easing} to a Framer Motion easing`)
}

export function toTransition(timing: EffectTiming): Transition {
	const { duration = 0, delay = 0, easing = 'ease' } = timing
	if (typeof duration != 'number') throw new Error('Duration must be a number')

	return {
		duration: duration / 1000,
		delay: delay / 1000,
		ease: toEase(easing)
	}
}

export function useTiming(timing: EffectTiming): Transition {
	const [ret, setRet] = React.useState<Transition>(toTransition(timing))

	// Use an effect in case they pass in a conditional timing i.e. the default ones
	React.useEffect(() => {
		setRet(toTransition(timing))
	}, [timing])

	return ret
}
