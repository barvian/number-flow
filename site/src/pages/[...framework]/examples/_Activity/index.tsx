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

	const [reposts, incrementReposts, reposted] = useCounter(2, inView)
	const [likes, incrementLikes, liked] = useCounter(50, inView, 5)
	const [bookmarks, incrementBookmarks, bookmarked] = useCounter(40, inView, 3)
	const [views] = useCounter(995, inView, 50)

	return (
		<Demo ref={ref} {...rest} code={children}>
			<Example
				likes={likes}
				liked={liked}
				reposts={reposts}
				onRepost={incrementReposts}
				reposted={reposted}
				bookmarks={bookmarks}
				onBookmark={incrementBookmarks}
				bookmarked={bookmarked}
				onLike={incrementLikes}
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

		const randomlyIncrease = () => {
			timeout = setTimeout(() => {
				setCount((c) => c + randomBetween(1, 3) * rate)
				randomlyIncrease()
			}, 3000)
		}

		randomlyIncrease()

		return () => {
			if (timeout) clearTimeout(timeout)
		}
	}, [active])

	const increment = () => {
		setCount((c) => c + 1)
		setHasIncremented(true)
	}

	return [count, increment, hasIncremented] as const
}
