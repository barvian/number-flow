import * as React from 'react'
import { useInView } from 'framer-motion'

const all = new Map<string, HTMLVideoElement>()

export default function TweetMediaVideo(props: JSX.IntrinsicElements['video']) {
	const ref = React.useRef<HTMLVideoElement | null>(null)
	const inView = useInView(ref, { amount: 'all' })
	React.useEffect(() => {
		if (!inView) return
		ref.current?.play()
	}, [inView])
	const id = React.useId()

	return (
		<video
			ref={(el) => {
				ref.current = el
				if (el) all.set(id, el)
				else all.delete(id)
			}}
			{...props}
			onPlay={() => {
				all.forEach((el) => {
					if (el !== ref.current) el.pause()
				})
			}}
			onClick={({ currentTarget }) => currentTarget[currentTarget.paused ? 'play' : 'pause']()}
		/>
	)
}
