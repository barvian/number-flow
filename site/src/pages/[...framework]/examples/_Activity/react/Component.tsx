import NumberFlow, { continuous, type Format } from '@number-flow/react'
import clsx from 'clsx/lite'
import { Bookmark, ChartNoAxesColumn, Heart, Repeat, Share } from 'lucide-react'

const format: Format = {
	notation: 'compact',
	compactDisplay: 'short',
	roundingMode: 'trunc'
}

type Props = JSX.IntrinsicElements['div'] & {
	likes: number
	reposts: number
	views: number
	bookmarks: number
	liked: boolean
	reposted: boolean
	bookmarked: boolean
	onLike: () => void
	onBookmark: () => void
	onRepost: () => void
}

export default function Activity({
	className,
	likes,
	reposts,
	views,
	bookmarks,
	onLike,
	onRepost,
	onBookmark,
	liked,
	reposted,
	bookmarked,
	...rest
}: Props) {
	return (
		<div
			{...rest}
			className={clsx(
				className,
				'flex w-full select-none items-center text-zinc-600 dark:text-zinc-300'
			)}
		>
			<div className="flex flex-1 items-center gap-1.5">
				<ChartNoAxesColumn absoluteStrokeWidth className="~size-4/5" />
				<NumberFlow
					willChange
					plugins={[continuous]}
					value={views}
					locales="en-US"
					format={format}
				/>
			</div>
			<div className="flex-1">
				<button
					className={clsx(
						'group flex items-center gap-1.5 pr-1.5 transition-[color] hover:text-emerald-500',
						reposted && 'text-emerald-500'
					)}
					onClick={onRepost}
				>
					<div className="relative before:absolute before:-inset-2.5 before:rounded-full before:transition-[background-color] before:group-hover:bg-emerald-500/10">
						<Repeat
							absoluteStrokeWidth
							className="~size-4/5 group-active:spring-duration-[25] spring-bounce-50 spring-duration-300 transition-transform group-active:scale-[85%]"
						/>
					</div>
					<NumberFlow
						willChange
						plugins={[continuous]}
						value={reposts}
						locales="en-US"
						format={format}
					/>
				</button>
			</div>
			<div className="flex-1">
				<button
					className={clsx(
						'group flex items-center gap-1.5 pr-1.5 transition-[color] hover:text-pink-500',
						liked && 'text-pink-500'
					)}
					onClick={onLike}
				>
					<div className="relative before:absolute before:-inset-2.5 before:rounded-full before:transition-[background-color] before:group-hover:bg-pink-500/10">
						<Heart
							absoluteStrokeWidth
							className={clsx(
								'~size-4/5 group-active:spring-duration-[25] spring-bounce-[65] spring-duration-300 transition-transform group-active:scale-[80%]',
								liked && 'fill-current'
							)}
						/>
					</div>
					<NumberFlow
						willChange
						plugins={[continuous]}
						value={likes}
						locales="en-US"
						format={format}
					/>
				</button>
			</div>
			<div className="min-[30rem]:flex-1 max-[24rem]:hidden flex shrink-0 items-center gap-1.5">
				<button
					className={clsx(
						'group flex items-center gap-1.5 pr-1.5 transition-[color] hover:text-blue-500',
						bookmarked && 'text-blue-500'
					)}
					onClick={onBookmark}
				>
					<div className="relative before:absolute before:-inset-2.5 before:rounded-full before:transition-[background-color] before:group-hover:bg-blue-500/10">
						<Bookmark
							absoluteStrokeWidth
							className={clsx(
								'~size-4/5 group-active:spring-duration-[25] spring-bounce-50 spring-duration-300 transition-transform group-active:scale-[85%]',
								bookmarked && 'fill-current'
							)}
						/>
					</div>
					<NumberFlow
						className="max-[30rem]:hidden"
						willChange
						plugins={[continuous]}
						value={bookmarks}
						locales="en-US"
						format={format}
					/>
				</button>
			</div>
			<Share absoluteStrokeWidth className="~size-4/5 shrink-0" />
		</div>
	)
}
