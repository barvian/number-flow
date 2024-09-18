export function frames<F extends string | (number | null)>(
	duration: number,
	frame: (t: number) => F
): F[] {
	const length = duration * 0.06 // 60fps
	return Array.from({ length }, (_, i) => frame(i / length))
}

export const lerp = (min: number, max: number, fac: number) => min + (max - min) * fac
