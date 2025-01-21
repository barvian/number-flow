<script lang="ts">
	import NumberFlow, { continuous, type Format } from '@number-flow/svelte'
	import clsx from 'clsx/lite'
	import { Bookmark, ChartNoAxesColumn, Heart, Repeat, Share } from 'lucide-svelte'
	import type { HTMLAttributes } from 'svelte/elements'

	type Props = HTMLAttributes<HTMLDivElement> & {
		likes: number
		reposts: number
		views: number
		bookmarks: number
		liked: boolean
		reposted: boolean
		bookmarked: boolean
		onlike: () => void
		onrepost: () => void
		onbookmark: () => void
	}

	const format: Format = {
		notation: 'compact',
		compactDisplay: 'short',
		roundingMode: 'trunc'
	}

	const {
		likes,
		reposts,
		views,
		bookmarks,
		liked,
		reposted,
		bookmarked,
		onlike,
		onrepost,
		onbookmark,
		class: cls,
		...props
	}: Props = $props()
</script>

<div
	{...props}
	class={clsx(cls, 'flex w-full select-none items-center text-zinc-600 dark:text-zinc-300')}
>
	<div class="flex flex-1 items-center gap-1.5">
		<ChartNoAxesColumn absoluteStrokeWidth class="~size-4/5" />
		<NumberFlow willChange plugins={[continuous]} value={views} locales="en-US" {format} />
	</div>
	<div class="flex-1">
		<button
			class="group flex items-center gap-1.5 pr-1.5 transition-[color] hover:text-emerald-500"
			class:text-emerald-500={reposted}
			onclick={onrepost}
		>
			<div
				class="relative before:absolute before:-inset-2.5 before:rounded-full before:transition-[background-color] before:group-hover:bg-emerald-500/10"
			>
				<Repeat
					absoluteStrokeWidth
					class="~size-4/5 group-active:spring-duration-[25] spring-bounce-50 spring-duration-300 transition-transform group-active:scale-[85%]"
				/>
			</div>
			<NumberFlow willChange plugins={[continuous]} value={reposts} locales="en-US" {format} />
		</button>
	</div>
	<div class="flex-1">
		<button
			class="group flex items-center gap-1.5 pr-1.5 transition-[color] hover:text-pink-500"
			class:text-pink-500={liked}
			onclick={onlike}
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
			<NumberFlow willChange plugins={[continuous]} value={likes} locales="en-US" {format} />
		</button>
	</div>
	<div class="min-[30rem]:flex-1 max-[24rem]:hidden flex shrink-0 items-center gap-1.5">
		<button
			class="group flex items-center gap-1.5 pr-1.5 transition-[color] hover:text-blue-500"
			class:text-blue-500={bookmarked}
			onclick={onbookmark}
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
			<NumberFlow
				class="max-[30rem]:hidden"
				willChange
				plugins={[continuous]}
				value={bookmarks}
				locales="en-US"
				{format}
			/>
		</button>
	</div>
	<Share absoluteStrokeWidth class="~size-4/5 shrink-0" />
</div>
