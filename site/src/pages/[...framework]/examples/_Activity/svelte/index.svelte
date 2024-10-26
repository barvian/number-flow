<script lang="ts">
	import Component from './Component.svelte'
	import {
		$bookmarks as bookmarks,
		$likes as likes,
		$reposts as reposts,
		$views as views
	} from '../stores'
</script>

<Component
	class="~px-0/16"
	likes={$likes.count}
	onlike={likes.toggle}
	liked={$likes.hasIncremented}
	reposts={$reposts.count}
	onrepost={reposts.toggle}
	reposted={$reposts.hasIncremented}
	bookmarks={$bookmarks.count}
	onbookmark={bookmarks.toggle}
	bookmarked={$bookmarks.hasIncremented}
	views={$views.count}
/>
