import Component from './Component'
import { useStore } from '@nanostores/react'
import { $bookmarks, $likes, $reposts, $views } from '../stores'

export default function () {
	const reposts = useStore($reposts)
	const bookmarks = useStore($bookmarks)
	const likes = useStore($likes)
	const views = useStore($views)

	return (
		<Component
			className="~px-0/16"
			likes={likes.count}
			onLike={$likes.toggle}
			liked={likes.hasIncremented}
			reposts={reposts.count}
			onRepost={$reposts.toggle}
			reposted={reposts.hasIncremented}
			bookmarks={bookmarks.count}
			onBookmark={$bookmarks.toggle}
			bookmarked={bookmarks.hasIncremented}
			views={views.count}
		/>
	)
}
