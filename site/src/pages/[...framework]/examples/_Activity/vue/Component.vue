<script setup lang="ts">
import NumberFlow, { type Format } from '@number-flow/vue'
import { Bookmark, ChartNoAxesColumn, Heart, Repeat, Share } from 'lucide-vue-next'

const format: Format = {
	notation: 'compact',
	compactDisplay: 'short',
	roundingMode: 'trunc'
}

const { likes, reposts, views, bookmarks, liked, reposted, bookmarked } = defineProps<{
	likes: number
	reposts: number
	views: number
	bookmarks: number
	liked: boolean
	reposted: boolean
	bookmarked: boolean
}>()

const emit = defineEmits<{
	(e: 'like'): void
	(e: 'repost'): void
	(e: 'bookmark'): void
}>()
</script>

<template>
	<div class="flex w-full select-none items-center text-zinc-600 dark:text-zinc-300">
		<div class="flex flex-1 items-center gap-1.5">
			<ChartNoAxesColumn absoluteStrokeWidth class="~size-4/5" />
			<NumberFlow willChange continuous :value="views" :format />
		</div>
		<div class="flex-1">
			<button
				:class="[
					'group flex items-center gap-1.5 pr-1.5 transition-[color] hover:text-emerald-500',
					reposted && 'text-emerald-500'
				]"
				@click="emit('repost')""
			>
				<div class="relative before:absolute before:-inset-2.5 before:rounded-full before:transition-[background-color] before:group-hover:bg-emerald-500/10">
					<Repeat
						absoluteStrokeWidth
						class="~size-4/5 group-active:spring-duration-[25] spring-bounce-50 spring-duration-300 transition-transform group-active:scale-[85%]"
					/>
				</div>
				<NumberFlow willChange continuous :value="reposts" :format />
			</button>
		</div>
		<div class="flex-1">
			<button
				:class="[
					'group flex items-center gap-1.5 pr-1.5 transition-[color] hover:text-pink-500',
					liked && 'text-pink-500'
				]"
				@click="emit('like')"
			>
				<div class="relative before:absolute before:-inset-2.5 before:rounded-full before:transition-[background-color] before:group-hover:bg-pink-500/10">
					<Heart
						absoluteStrokeWidth
						:class="[
							'~size-4/5 group-active:spring-duration-[25] spring-bounce-[65] spring-duration-300 transition-transform group-active:scale-[80%]',
							liked && 'fill-current'
						]"
					/>
				</div>
				<NumberFlow willChange continuous :value="likes" :format />
			</button>
		</div>
		<div class="flex shrink-0 min-[30rem]:flex-1 items-center gap-1.5 max-[24rem]:hidden">
			<button
				:class="[
					'group flex items-center gap-1.5 pr-1.5 transition-[color] hover:text-blue-500',
					bookmarked && 'text-blue-500'
				]"
				@click="emit('bookmark')"
			>
				<div class="relative before:absolute before:-inset-2.5 before:rounded-full before:transition-[background-color] before:group-hover:bg-blue-500/10">
					<Bookmark
						absoluteStrokeWidth
						:class="[
							'~size-4/5 group-active:spring-duration-[25] spring-bounce-50 spring-duration-300 transition-transform group-active:scale-[85%]',
							bookmarked && 'fill-current'
						]"
					/>
				</div>
				<NumberFlow class="max-[30rem]:hidden" willChange continuous :value="bookmarks" :format />
			</button>
		</div>
		<Share absoluteStrokeWidth class="~size-4/5 shrink-0" />
	</div>
</template>
