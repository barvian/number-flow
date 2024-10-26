import type { Heading } from '@/context/toc'
import * as React from 'react'

export type Props = JSX.IntrinsicElements['nav'] & {
	headings: Heading[]
}

const tops = new WeakMap<Heading, number>()

function getTop(id: Heading['id']) {
	let el = document.getElementById(id)
	return el ? el.getBoundingClientRect().top + window.scrollY : 0
}

export default function TOC({ headings, ...props }: Props) {
	const [active, setActive] = React.useState(headings[0]?.id)

	React.useEffect(() => {
		let scrollPt = 0
		function onResize() {
			for (const heading of headings) {
				tops.set(heading, getTop(heading.id))
			}
			const rootStyle = window.getComputedStyle(document.documentElement)
			scrollPt = parseFloat(rootStyle.getPropertyValue('scroll-padding-top').match(/[\d.]+/)?.[0]!)
		}
		window.addEventListener('resize', onResize)
		onResize()

		function onScroll() {
			// let fontSize = parseFloat(style.fontSize.match(/[\d.]+/)?.[0] ?? 16)
			// scrollMt = scrollMt * fontSize

			// let sortedHeadings = headings.sort((a, b) => tops.get(a)! - tops.get(b)!)
			let top = window.scrollY // + scrollMt + 1
			const current = headings.findLast((h) => top >= tops.get(h)! - scrollPt - 1) ?? headings[0]
			setActive(current!.id)
		}

		window.addEventListener('scroll', onScroll, {
			capture: true
			// passive: true
		})
		onScroll()

		return () => {
			window.removeEventListener('resize', onResize)
			window.removeEventListener('scroll', onScroll, {
				capture: true
			})
		}
	}, [])

	return (
		<nav {...props} id="toc" aria-label="Table Of Contents">
			<ol className="space-y-4 text-sm">
				{headings.map((h) => (
					<li key={h.id}>
						<a
							data-active={h.id === active || undefined}
							className="opacity-40 transition-opacity hover:opacity-70 data-[active]:opacity-100 dark:opacity-50"
							href={`#${h.id}`}
						>
							{h.title}
						</a>
					</li>
				))}
			</ol>
		</nav>
	)
}
