import * as React from 'react'

const all = new Map<string, HTMLVideoElement>()

export default function TweetMediaVideo(props: JSX.IntrinsicElements['video']) {
	const ref = React.useRef<HTMLVideoElement | null>(null)
	React.useEffect(() => {
		if (!ref.current) return
		const io = new IntersectionObserver(
			(entry) => {
				if (!entry?.[0]) return
				const { isIntersecting, target } = entry[0]
				if (isIntersecting) (target as HTMLVideoElement).play()
			},
			{ threshold: 1 }
		)
		io.observe(ref.current)
		return () => {
			io.disconnect()
		}
	}, [])
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
