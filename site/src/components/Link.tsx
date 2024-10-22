import * as React from 'react'
import { useStore } from '@nanostores/react'
import { urlAtom, pageFrameworkAtom } from '@/stores/url'
import type { AnchorHTMLAttributes } from 'react'
import { isActive } from '../lib/url'
import { type Framework, toFrameworkPath } from '@/lib/framework'
import { ArrowUpRight } from 'lucide-react'
import clsx from 'clsx/lite'

export type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
	frameworked?: boolean
	active?: React.ReactNode
}

export default function Link({
	href: _href,
	className,
	children,
	target,
	frameworked = true,
	active: activeChildren,
	...props
}: Props) {
	const pageFramework = useStore(pageFrameworkAtom)
	const ref = React.useRef<HTMLAnchorElement>(null)
	const [savedFramework, setSavedFramework] = React.useState<Framework | null>(null)
	React.useEffect(() => {
		if (!pageFramework) setSavedFramework(localStorage.getItem('framework') as Framework)
	}, [pageFramework])
	const framework = React.useMemo(
		() => pageFramework ?? savedFramework,
		[pageFramework, savedFramework]
	)
	const url = useStore(urlAtom)

	const isExternal = _href && url && new URL(_href, url.origin).origin !== url.origin
	const href = !isExternal && frameworked && framework ? toFrameworkPath(_href, framework) : _href
	React.useEffect(() => {
		// Workaround for a weird Astro VT bug I think:
		if (href) ref.current?.setAttribute('href', href)
	}, [href])

	const active = isActive(href, url)

	return (
		<a
			{...props}
			ref={ref}
			className={clsx(className, 'group/link')}
			target={isExternal ? '_blank' : target}
			data-active={active ? '' : undefined}
			data-framework={framework}
		>
			{active && activeChildren}
			{children}
			{isExternal && (
				<ArrowUpRight className="ml-[0.125em] inline-block size-[1em] no-underline transition-transform group-hover/link:-translate-y-px group-hover/link:translate-x-px" />
			)}
		</a>
	)
}
