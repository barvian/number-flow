import MotionNumber, { type MotionNumberProps } from 'motion-number'
import useCycle from '../hooks/useCycle'
import { useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

const NUMBERS = [12398.4, -3243.6, 543.2]
const LOCALES = ['fr-FR', 'en-US']
const FORMATS = [
	{
		style: 'unit',
		unit: 'meter',
		notation: 'compact'
	},
	{
		style: 'currency',
		currency: 'USD',
		currencySign: 'accounting',
		signDisplay: 'always'
	},
	{},
	{
		style: 'percent',
		signDisplay: 'always'
	}
] as MotionNumberProps['format'][]

export default function Hero({
	description,
	version,
	repo
}: {
	description: string
	version: string
	repo: string
}) {
	const [value, cycleValue] = useCycle(NUMBERS)
	const [locale, cycleLocale] = useCycle(LOCALES)
	const [format, cycleFormat] = useCycle(FORMATS)

	const ref = useRef<HTMLElement>(null)
	const inView = useInView(ref, { once: true })
	const timeoutRef = useRef<NodeJS.Timeout>()
	useEffect(() => {
		if (!inView) return
		timeoutRef.current = setTimeout(() => {
			// Get off the initial "hello" easter egg:
			cycleValue()
			cycleLocale()
			cycleFormat()
		}, 750)
		return () => {
			clearTimeout(timeoutRef.current)
		}
	}, [inView])

	return (
		<header
			ref={ref}
			className="~mb-16/24 container flex w-full flex-col items-center gap-2 overflow-x-clip text-center"
		>
			<h1 className="text-sm font-medium">
				MotionNumber <span className="text-zinc-500 dark:text-zinc-400">v{version}</span>
			</h1>
			<div className="~mt-0/0.5 ~mb-0.5/1">
				<MotionNumber
					className="~text-5xl/8xl font-medium [--mask-height:0.25em]"
					style={{ lineHeight: 0.85 }}
					value={value}
					locales={locale}
					format={format}
				/>
			</div>
			<p className="~text-lg/xl text-balance text-zinc-500 dark:text-zinc-400">{description}</p>
			<div className="~mt-3/5 flex w-full items-stretch justify-center gap-x-3">
				<button
					className="flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition duration-[.16s] ease-[cubic-bezier(.4,0,.2,1)] hover:brightness-125 active:scale-[98%] active:brightness-[98%] active:duration-[25ms]"
					onClick={() => {
						clearTimeout(timeoutRef.current)

						cycleValue()
						cycleLocale()
						cycleFormat()
					}}
				>
					<svg className="size-4" strokeLinejoin="round" viewBox="0 0 16 16">
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M2.72876 6.42462C3.40596 4.15488 5.51032 2.5 8.00002 2.5C10.0902 2.5 11.9092 3.66566 12.8405 5.38592L13.1975 6.04548L14.5166 5.33138L14.1596 4.67183C12.9767 2.48677 10.6625 1 8.00002 1C5.05453 1 2.53485 2.81872 1.50122 5.39447V3.75V3H0.0012207V3.75V7.17462C0.0012207 7.58883 0.337007 7.92462 0.751221 7.92462H4.17584H4.92584V6.42462H4.17584H2.72876ZM13.2713 9.57538H11.8243H11.0743V8.07538H11.8243H15.2489C15.6631 8.07538 15.9989 8.41117 15.9989 8.82538V12.25V13H14.4989V12.25V10.6053C13.4653 13.1812 10.9456 15 8.00002 15C5.35065 15 3.04619 13.5279 1.85809 11.3605L1.49757 10.7029L2.8129 9.98181L3.17342 10.6395C4.10882 12.3458 5.92017 13.5 8.00002 13.5C10.4897 13.5 12.5941 11.8451 13.2713 9.57538Z"
							fill="currentColor"
						></path>
					</svg>
					Shuffle
				</button>
				<a
					href={repo}
					target="_blank"
					className="flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition duration-[.16s] ease-[cubic-bezier(.4,0,.2,1)] hover:bg-zinc-100 active:scale-[98%] active:brightness-[98%] active:duration-[25ms] dark:hover:bg-zinc-900 dark:hover:brightness-125"
				>
					<svg viewBox="0 0 16 16" className="size-4" fill="currentColor" role="none">
						<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
					</svg>
					GitHub
				</a>
			</div>
		</header>
	)
}
