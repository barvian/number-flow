import * as React from 'react'
import Demo, { type DemoProps } from '@/components/Demo'
import useCycle from '@/hooks/useCycle'
import Example from './Example'
import type { Rename } from '@/lib/types'
import { useInView } from 'framer-motion'

const LIKES = [50, 96, 120]

export default function DemoIndicator({
	children,
	...rest
}: Rename<Omit<DemoProps, 'children'>, 'code', 'children'>) {
	const ref = React.useRef<HTMLDivElement>(null)
	const inView = useInView(ref)

	const [reposts, onRepost, reposted] = useCounter(2, inView)
	const [likes, onLike, liked] = useCounter(50, inView, 5)
	const [bookmarks, onBookmark, bookmarked] = useCounter(40, inView, 3)
	const [views] = useCounter(995, inView, 50)

	return (
		<Demo ref={ref} {...rest} code={children}>
			<Example
				likes={likes}
				liked={liked}
				reposts={reposts}
				onRepost={onRepost}
				reposted={reposted}
				bookmarks={bookmarks}
				onBookmark={onBookmark}
				bookmarked={bookmarked}
				onLike={onLike}
				views={views}
			/>
		</Demo>
	)
}

// Generate a random number between two numbers:
function randomBetween(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

function useCounter(initialValue: number, active: boolean, rate = 1) {
	const [count, setCount] = React.useState(initialValue)
	const [hasIncremented, setHasIncremented] = React.useState(false)

	React.useEffect(() => {
		if (!active) return

		let timeout: NodeJS.Timeout | null = null

		const randomlyIncrease = (delay: number) => {
			timeout = setTimeout(() => {
				setCount((c) => c + randomBetween(1, 3) * rate)
				randomlyIncrease(3000)
			}, delay)
		}

		randomlyIncrease(1500)

		return () => {
			if (timeout) clearTimeout(timeout)
		}
	}, [active])

	const toggle = () => {
		if (hasIncremented) setCount((c) => c - 1)
		else setCount((c) => c + 1)
		setHasIncremented((i) => !i)
	}

	return [count, toggle, hasIncremented] as const
}
