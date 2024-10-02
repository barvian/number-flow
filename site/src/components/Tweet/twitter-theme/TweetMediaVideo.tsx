import * as React from 'react'
import { useInView } from 'framer-motion'
import type { MediaAnimatedGif, MediaVideo } from '../api/index.js'
import { type EnrichedQuotedTweet, type EnrichedTweet, getMediaUrl, getMp4Video } from '../utils.js'
import mediaStyles from './tweet-media.module.css'

interface Props {
	autoplay?: boolean
	tweet: EnrichedTweet | EnrichedQuotedTweet
	media: MediaAnimatedGif | MediaVideo
}

const allVideos = new Map<string, HTMLVideoElement>()

export default function TweetMediaVideo({ autoplay, media }: Props) {
	const ref = React.useRef<HTMLVideoElement | null>(null)
	const id = React.useId()
	const mp4Video = getMp4Video(media)

	const inView = useInView(ref, { amount: 'all' })
	React.useEffect(() => {
		if (inView) ref.current?.play()
	}, [inView])

	return (
		<video
			ref={(el) => {
				ref.current = el
				if (el) allVideos.set(id, el)
				else allVideos.delete(id)
			}}
			className={mediaStyles.image}
			poster={getMediaUrl(media, 'small')}
			autoPlay={autoplay}
			onPlay={(event) => {
				allVideos.forEach((v) => {
					if (v !== event.currentTarget) v.pause()
				})
			}}
			onClick={(event) => {
				const video = event.currentTarget
				if (video.paused) video.play()
				else video.pause()
			}}
			playsInline
			loop
			muted
			preload="metadata"
		>
			{mp4Video && <source src={mp4Video.url} type={mp4Video.content_type} />}
		</video>
	)
}
