'use client'

import * as React from 'react'
import MotionNumber from 'motion-number'

const NUMBERS = [12398.4, -3243.6, 'sds']
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
	}
	// {},
	// {
	// 	style: 'percent',
	// 	signDisplay: 'always'
	// }
] as Intl.NumberFormatOptions[]

export default function Home() {
	const [value, cycleValue] = useCycle(NUMBERS)
	const [locale, cycleLocale] = useCycle(LOCALES)
	const [format, cycleFormat] = useCycle(FORMATS)

	return (
		<main className="flex min-h-screen flex-col items-center justify-around">
			<span className="flex items-baseline gap-3">
				<span className="text-9xl/normal">
					<MotionNumber value={value} locales={locale} format={format} />
				</span>
				<span>123.4</span>
			</span>
			<button
				className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#F7F8F9] p-2 transition-transform duration-150 ease-[cubic-bezier(.4,0,.2,1)] active:scale-95"
				onClick={() => {
					cycleValue()
					cycleLocale()
					cycleFormat()
				}}
			>
				<svg className="size-14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M7.01605 4.23143C7.41414 4.24732 7.80173 4.36528 8.14286 4.57443C8.48402 4.78361 8.76817 5.07756 8.96825 5.42955C8.97143 5.43515 8.9747 5.4407 8.97806 5.44619L9.28569 5.95021L8.84816 5.8312C8.52114 5.74225 8.18591 5.93578 8.09942 6.26346C8.01292 6.59115 8.20791 6.92889 8.53493 7.01784L10.4533 7.53964C10.7804 7.62859 11.1156 7.43506 11.2021 7.10737L11.7161 5.16001C11.8026 4.83232 11.6076 4.49458 11.2806 4.40563C10.9536 4.31668 10.6183 4.51021 10.5318 4.83789L10.3831 5.40132L10.0263 4.81667C9.72358 4.2876 9.29396 3.84355 8.77647 3.52625C8.25608 3.20718 7.66437 3.02706 7.05677 3.00282C6.44919 2.97858 5.84627 3.11101 5.30421 3.38693C4.76221 3.66281 4.29879 4.0731 3.95651 4.57888C3.76701 4.8589 3.84055 5.24157 4.12076 5.4336C4.40096 5.62563 4.78174 5.55431 4.97124 5.27428C5.19885 4.93794 5.50618 4.66638 5.86388 4.4843C6.22152 4.30226 6.61792 4.21555 7.01605 4.23143ZM3.13489 6.68396C3.09359 6.73945 3.06114 6.80293 3.04017 6.87287C3.03808 6.87985 3.0361 6.88687 3.03426 6.89392L2.52051 8.8402C2.43402 9.16789 2.629 9.50563 2.95603 9.59458C3.28305 9.68353 3.61828 9.49 3.70478 9.16232L3.85349 8.59892L4.2102 9.18334C4.51288 9.7124 4.9425 10.1565 5.45999 10.4737C5.98038 10.7928 6.57209 10.9729 7.1797 10.9972C7.78727 11.0214 8.39019 10.889 8.93225 10.6131C9.47425 10.3372 9.93768 9.9269 10.28 9.42112C10.4695 9.1411 10.3959 8.75843 10.1157 8.5664C9.8355 8.37437 9.45472 8.44569 9.26523 8.72572C9.03761 9.06206 8.73029 9.33362 8.37259 9.5157C8.01494 9.69774 7.61854 9.78445 7.22042 9.76857C6.82232 9.75268 6.43473 9.63472 6.09361 9.42557C5.75245 9.21639 5.4683 8.92244 5.26821 8.57045C5.26503 8.56485 5.26176 8.5593 5.25841 8.55381L4.95089 8.05L5.38846 8.16901C5.71548 8.25796 6.05071 8.06443 6.1372 7.73675C6.2237 7.40906 6.02871 7.07132 5.70169 6.98237L3.78455 6.46091L3.77758 6.45905C3.6966 6.43784 3.61519 6.43389 3.53728 6.44495C3.45936 6.45594 3.38241 6.4823 3.31081 6.52511C3.30322 6.52965 3.29572 6.53435 3.28833 6.53922C3.22753 6.57921 3.17615 6.62844 3.13489 6.68396Z"
						fill="#8F8F8F"
					/>
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
