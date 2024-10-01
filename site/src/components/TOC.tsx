import type { MarkdownHeading } from 'astro'
import * as React from 'react'

type Props = JSX.IntrinsicElements['nav'] & {
	headings: MarkdownHeading[]
}
export default function TOC({ headings, ...props }: Props) {
	const h2s = React.useMemo(() => headings.filter((h) => h.depth <= 2), [headings])
	const linkRefs = React.useRef<Record<string, HTMLAnchorElement | null>>({})

	const [activeSlug, setActiveSlug] = React.useState(headings[0]?.slug)

	React.useEffect(() => {
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const section = entry.target as HTMLElement
						setActiveSlug(section.dataset.slug)
						break
					}
				}
			},
			{
				rootMargin: '-20% 0% -80%' // a sliver near the top of the viewport
			}
		)

		h2s.forEach((h) => {
			const section = document.getElementById(h.slug)?.closest('section')
			if (section) {
				section.dataset.slug = h.slug
				io.observe(section)
			}
		})

		return () => {
			io.disconnect()
		}
	}, [])

	return (
		<nav {...props} id="toc" aria-label="Table Of Contents">
			<ol className="space-y-4 text-sm">
				{h2s.map((h) => (
					<li key={h.slug}>
						<a
							ref={(el) => (linkRefs.current[h.slug] = el)}
							data-active={h.slug === activeSlug || undefined}
							className="opacity-40 data-[active]:opacity-100 dark:opacity-50"
							href={`#${h.slug}`}
						>
							{h.text}
						</a>
					</li>
				))}
			</ol>
		</nav>
	)
}
