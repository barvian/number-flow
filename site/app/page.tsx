'use client'

import * as React from 'react'
import MotionNumber, { type MotionNumberProps } from 'motion-number'

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

export default function Home() {
	const [justify, cycleJustify] = useCycle(['items-start', 'items-end'])
	const [value, cycleValue] = useCycle(NUMBERS)
	const [locale, cycleLocale] = useCycle(LOCALES)
	const [format, cycleFormat] = useCycle(FORMATS)

	return (
		<main className={`flex min-h-screen flex-col ${justify} justify-around`}>
			<span className="flex items-baseline gap-3">
				<span className="text-9xl/normal font-medium">
					<MotionNumber value={value} locales={locale} format={format} />
				</span>
				{/* <span>123.4</span> */}
			</span>
			<button
				className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#232323] p-5 transition duration-[.16s] ease-[cubic-bezier(.4,0,.2,1)] hover:brightness-125 active:scale-95 active:brightness-[98%]"
				onClick={() => {
					cycleValue()
					cycleLocale()
					cycleFormat()
					cycleJustify()
				}}
			>
				<svg className="size-8" strokeLinejoin="round" viewBox="0 0 16 16">
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M2.72876 6.42462C3.40596 4.15488 5.51032 2.5 8.00002 2.5C10.0902 2.5 11.9092 3.66566 12.8405 5.38592L13.1975 6.04548L14.5166 5.33138L14.1596 4.67183C12.9767 2.48677 10.6625 1 8.00002 1C5.05453 1 2.53485 2.81872 1.50122 5.39447V3.75V3H0.0012207V3.75V7.17462C0.0012207 7.58883 0.337007 7.92462 0.751221 7.92462H4.17584H4.92584V6.42462H4.17584H2.72876ZM13.2713 9.57538H11.8243H11.0743V8.07538H11.8243H15.2489C15.6631 8.07538 15.9989 8.41117 15.9989 8.82538V12.25V13H14.4989V12.25V10.6053C13.4653 13.1812 10.9456 15 8.00002 15C5.35065 15 3.04619 13.5279 1.85809 11.3605L1.49757 10.7029L2.8129 9.98181L3.17342 10.6395C4.10882 12.3458 5.92017 13.5 8.00002 13.5C10.4897 13.5 12.5941 11.8451 13.2713 9.57538Z"
						fill="currentColor"
					></path>
				</svg>
			</button>
		</main>
	)
}

function useCycle<T>(options: Array<T>) {
	const [index, setIndex] = React.useState(0)
	const next = () => setIndex((i) => (i + 1) % options.length)

	return [options[index], next] as const
}
