const rafs = new WeakMap<WeakKey, number[]>()

let ctx: WeakKey | null

const raf = (fn: FrameRequestCallback) => {
	if (!ctx) return
	const id = requestAnimationFrame(fn)
	rafs.get(ctx)!.push(id)
	return id
}

export default raf

export const useRafContext = (c: WeakKey, fn: () => void) => {
	if (c && !rafs.has(c)) rafs.set(c, [])
	ctx = c
	fn()
	ctx = null
}

export const getRafs = (c: WeakKey) => rafs.get(c)
