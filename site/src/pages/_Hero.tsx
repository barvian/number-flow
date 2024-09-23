import NumberFlow, { type Format } from '@number-flow/react'
import useCycle from '../hooks/useCycle'
import { useEffect, useRef } from 'react'
import { useInView, MotionConfig } from 'framer-motion'
// const MotionNumberFlow = motion(NumberFlow)
import { ArrowUpRightIcon } from '@heroicons/react/20/solid'

const NUMBERS = [321, -3241.6, 42, 398.43, -3243.5, 1435237.2, 12348.43, -3243.6, 54323.2]
const LOCALES = ['fr-FR', 'en-US', 'fr-FR', 'en-US', 'en-US', 'zh-CN', 'en-US', 'en-US', 'fr-FR']
const FORMATS = [
	{
		// style: "unit",
		// unit: "meter",
		// notation: "compact",
		// signDisplay: "never",
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
	},
	{},
	{
		style: 'unit',
		unit: 'meter',
		notation: 'compact',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		signDisplay: 'never'
	},
	{
		style: 'currency',
		currency: 'USD'
	},
	{},
	{
		// style: "percent",
		signDisplay: 'always'
	}
] as Format[]

export default function Hero({ title }: { title: string }) {
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
			className="~mb-16/24 container flex w-full flex-col items-center gap-2 text-center"
		>
			<h1 className="text-framework text-sm font-medium">{title}</h1>
			<div className="~mb-0.5/1 flex items-center">
				<MotionConfig transition={{ duration: 1, type: 'spring', bounce: 0 }}>
					<NumberFlow
						className="~text-5xl/8xl font-medium [--mask-height:0.25em]"
						style={{ lineHeight: 0.85 }}
						value={value}
						locales={locale}
						format={format}
					/>
					{/* <motion.div
						layout
						style={{
							borderRadius: 999,
							whiteSpace: 'nowrap',
							backgroundColor: 'green',
							paddingInline: '5rem'
						}}
					>
						<motion.span layout="position" style={{ display: 'inline-block' }}>
							hi there this osidfj
						</motion.span>
						<MotionNumberFlow
							layout
							layoutRoot
							className="~text-5xl/8xl font-medium [--mask-height:0.25em]"
							style={{ lineHeight: 0.85 }}
							value={value + 8}
							locales={locale}
							format={format}
						/>
					</motion.div> */}
				</MotionConfig>
			</div>
			<p className="~text-base/lg prose dark:prose-invert text-balance text-zinc-500 dark:text-zinc-400">
				A lightweight component to format &amp; transition numbers. Built on{' '}
				<a
					href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat"
					target="_blank"
				>
					Intl.NumberFormat
				</a>{' '}
				and{' '}
				<a
					href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API"
					target="_blank"
				>
					WAAPI
				</a>
				. Accessible. Customizable.
			</p>
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
					href="/"
					target="_blank"
					className="flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition duration-[.16s] ease-[cubic-bezier(.4,0,.2,1)] hover:bg-zinc-100 active:scale-[98%] active:brightness-[98%] active:duration-[25ms] dark:hover:bg-zinc-900 dark:hover:brightness-125"
				>
					Open sandbox
					<ArrowUpRightIcon className="size-4" />
				</a>
			</div>
		</header>
	)
}
