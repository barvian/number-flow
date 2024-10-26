<script setup lang="ts">
import Component from './Component.vue'
import { useStore } from '@nanostores/vue'
import { $bookmarks, $likes, $reposts, $views } from '../stores'

const reposts = useStore($reposts)
const bookmarks = useStore($bookmarks)
const likes = useStore($likes)
const views = useStore($views)
</script>

<template>
	<Component
		class="~px-0/16"
		:likes="likes.count"
		@like="$likes.toggle"
		:liked="likes.hasIncremented"
		:reposts="reposts.count"
		@repost="$reposts.toggle"
		:reposted="reposts.hasIncremented"
		:bookmarks="bookmarks.count"
		@bookmark="$bookmarks.toggle"
		:bookmarked="bookmarks.hasIncremented"
		:views="views.count"
	/>
</template>
