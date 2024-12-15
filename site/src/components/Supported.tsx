import { useIsSupported, usePrefersReducedMotion } from '@number-flow/react'
import clsx from 'clsx/lite'
import Link from './Link'

export default function Supported() {
	const isSupported = useIsSupported()
	const reducedMotion = usePrefersReducedMotion()
	if (isSupported && !reducedMotion) return null

	return (
		<>
			{/* The only way I could get the blend mode working was to separate the divs which requires fixed sizes */}
			<div
				role="presentation"
				className={clsx(
					reducedMotion ? 'h-11.5' : 'h-16.5',
					'~top-4/8 fixed left-1/2 z-40 -ml-36 w-72 rounded-lg mix-blend-multiply shadow-lg shadow-amber-500/10 dark:shadow-amber-950/20'
				)}
			/>
			<div
				role="alert"
				className={clsx(
					reducedMotion ? 'h-11.5' : 'h-16.5',
					'~top-4/8 prose prose-current fixed left-1/2 z-50 -ml-36 w-72 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800 dark:border-amber-800/30 dark:bg-[#271202] dark:text-amber-50'
				)}
			>
				{reducedMotion ? (
					<p>Reduce motion is on</p>
				) : (
					<p>
						Your browser doesn't{' '}
						<Link href="https://caniuse.com/mdn-css_types_mod">
							support NumberFlow’s animations
						</Link>
					</p>
				)}
			</div>
		</>
	)
}
