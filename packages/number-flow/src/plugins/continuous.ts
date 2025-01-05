import { max } from '../util/math'
import type { Plugin } from '.'
import { NumberFlowLite } from '../lite'

const startingPos = new WeakMap<NumberFlowLite, number | undefined>()

/**
 * Makes number transitions appear to pass through in between numbers.
 */
export const continuous: Plugin = {
	onUpdate(data, prev, flow) {
		startingPos.set(flow, undefined)
		if (!flow.computedTrend) return

		// Find the starting pos based on the parts, not the value,
		// to handle e.g. compact notation where value = 1000 and integer part = 1
		const prevNumber = prev.integer
			.concat(prev.fraction)
			.filter((p) => p.type === 'integer' || p.type === 'fraction')
		const number = data.integer
			.concat(data.fraction)
			.filter((p) => p.type === 'integer' || p.type === 'fraction')
		const firstChangedPrev = prevNumber.find(
			(pp) => !number.find((p) => p.pos === pp.pos && p.value === pp.value)
		)
		const firstChanged = number.find(
			(p) => !prevNumber.find((pp) => p.pos === pp.pos && p.value === pp.value)
		)
		startingPos.set(flow, max(firstChangedPrev?.pos, firstChanged?.pos))
	},
	getDelta(value, prev, digit) {
		const diff = value - prev
		const starting = startingPos.get(digit.flow)
		// Loop once if it's continuous:
		if (!diff && starting != null && starting >= digit.pos) {
			return digit.length * digit.flow.computedTrend! // trend must exist if there's starting
		}
	}
}
