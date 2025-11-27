import { spring } from '@/lib/spring'
import { usePrefersReducedMotion } from '@number-flow/react'
import { cloneElement, useLayoutEffect, useRef } from 'react'
import { mergeRefs } from '@react-aria/utils'
import { Snapshotter, type SnapshotterProps } from './Snapshotter'

export type AnimateHeightProps = Pick<SnapshotterProps, 'dependencies'> & {
	children: React.ReactElement<{ ref: React.Ref<HTMLElement> }>
}

export default function AnimateHeightFragment(props: AnimateHeightProps) {
	const prefersReducedMotion = usePrefersReducedMotion()
	if (prefersReducedMotion) {
		return props.children
	}

	return <AnimateHeightImpl {...props} />
}

const timing = spring(0.15, 0)
console.log(timing)

function AnimateHeightImpl({ children, dependencies }: AnimateHeightProps) {
	const ref = useRef<HTMLElement>(null)
	const heightSnapshotRef = useRef<number | undefined>(undefined)

	useLayoutEffect(() => {
		if (!ref.current) return

		let animation: Animation | undefined
		const frame = requestAnimationFrame(() => {
			if (!ref.current) return
			const newHeight = ref.current.offsetHeight
			if (heightSnapshotRef.current === newHeight) return
			animation = ref.current.animate(
				{
					height: [`${heightSnapshotRef.current}px`, `${newHeight}px`]
				},
				timing
			)
		})
		// Use WAAPI because motion writes to inline styles which complicates
		// measuring:

		return () => {
			cancelAnimationFrame(frame)
			animation?.cancel()
		}
	}, dependencies)

	return (
		<>
			<Snapshotter
				dependencies={dependencies}
				onSnapshot={() => {
					if (!ref.current) return
					heightSnapshotRef.current = ref.current.offsetHeight
				}}
			/>
			{cloneElement(children, {
				ref: mergeRefs(ref, children.props.ref)
			})}
		</>
	)
}
