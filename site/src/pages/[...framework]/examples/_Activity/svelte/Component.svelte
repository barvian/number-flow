<script lang="ts">
	import NumberFlow, { type Format } from '@number-flow/svelte'
	import clsx from 'clsx/lite'
	import { Bookmark, ChartNoAxesColumn, Heart, Repeat, Share } from 'lucide-svelte'

	let cls = ''
	export { cls as class }

	export let likes: number
	export let reposts: number
	export let views: number
	export let bookmarks: number
	export let liked: boolean
	export let reposted: boolean
	export let bookmarked: boolean
	export let onlike: () => void
	export let onrepost: () => void
	export let onbookmark: () => void

	const format: Format = {
		notation: 'compact',
		compactDisplay: 'short',
		roundingMode: 'trunc'
	}
</script>

<div
	class={clsx(
		cls,
		'~text-[0.8125rem]/sm flex w-full select-none items-center text-zinc-600 dark:text-zinc-300'
	)}
>
	<div class="flex flex-1 items-center gap-1.5">
		<ChartNoAxesColumn absoluteStrokeWidth class="~size-4/5" />
		<NumberFlow willChange continuous value={views} {format} />
	</div>
	<div class="flex-1">
		<button
			class="group flex items-center gap-1.5 pr-1.5 transition-[color] hover:text-emerald-500"
			class:text-emerald-500={reposted}
			on:click={onrepost}
		>
			<div
				class="relative before:absolute before:-inset-2.5 before:rounded-full before:transition-[background-color] before:group-hover:bg-emerald-500/10"
			>
				<Repeat
					absoluteStrokeWidth
					class="~size-4/5 group-active:spring-duration-[25] spring-bounce-50 spring-duration-300 transition-transform group-active:scale-[85%]"
				/>
			</div>
			<NumberFlow willChange continuous value={reposts} {format} />
		</button>
	</div>
	<div class="flex-1">
		<button
			class="group flex items-center gap-1.5 pr-1.5 transition-[color] hover:text-pink-500"
			class:text-pink-500={liked}
			on:click={onlike}
		>
			<div
				class="relative before:absolute before:-inset-2.5 before:rounded-full before:transition-[background-color] before:group-hover:bg-pink-500/10"
			>
				<Heart
					absoluteStrokeWidth
					class={clsx(
						liked && 'fill-current',
						'~size-4/5 group-active:spring-duration-[25] spring-bounce-[65] spring-duration-300 transition-transform group-active:scale-[80%]'
					)}
				/>
			</div>
			<NumberFlow willChange continuous value={likes} {format} />
		</button>
	</div>
	<div class="flex flex-1 items-center gap-1.5">
		<button
			class="group flex items-center gap-1.5 pr-1.5 transition-[color] hover:text-blue-500"
			class:text-blue-500={bookmarked}
			on:click={onbookmark}
		>
			<div
				class="relative before:absolute before:-inset-2.5 before:rounded-full before:transition-[background-color] before:group-hover:bg-blue-500/10"
			>
				<Bookmark
					absoluteStrokeWidth
					class={clsx(
						bookmarked && 'fill-current',
						'~size-4/5 group-active:spring-duration-[25] spring-bounce-50 spring-duration-300 transition-transform group-active:scale-[85%]'
					)}
				/>
			</div>
			<NumberFlow willChange continuous value={bookmarks} {format} />
		</button>
	</div>
	<Share absoluteStrokeWidth class="~size-4/5 shrink-0" />
</div>
