import * as React from 'react'
import { useStore } from '@nanostores/react'
import { $url, $pageFramework } from '@/stores/url'
import type { AnchorHTMLAttributes } from 'react'
import { isActive } from '../lib/url'
import { type Framework, toFrameworkPath } from '@/lib/framework'
import { ArrowUpRight } from 'lucide-react'
import clsx from 'clsx/lite'

export type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & {
	frameworked?: boolean
	active?: React.ReactNode
	children?: React.ReactNode | ((renderProps: { isActive: boolean }) => React.ReactNode)
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
	const pageFramework = useStore($pageFramework)
	const ref = React.useRef<HTMLAnchorElement>(null)
	const [savedFramework, setSavedFramework] = React.useState<Framework | null>(null)
	React.useEffect(() => {
		if (!pageFramework) setSavedFramework(localStorage.getItem('framework') as Framework)
	}, [pageFramework])
	const framework = React.useMemo(
		() => pageFramework ?? savedFramework,
		[pageFramework, savedFramework]
	)
	const url = useStore($url)

	const isExternal = _href && url && new URL(_href, url.origin).origin !== url.origin
	const href = !isExternal && frameworked && framework ? toFrameworkPath(_href, framework) : _href
	React.useEffect(() => {
		// Double-set for a weird Astro VT bug I think:
		if (href) ref.current?.setAttribute('href', href)
	}, [href])

	const active = isActive(href, url)

	return (
		<a
			{...props}
			ref={ref}
			className={clsx(className, 'group/link', isExternal && 'pr-[1.125em]')}
			target={isExternal ? '_blank' : target}
			data-active={active ? '' : undefined}
			href={href}
			data-framework={framework}
		>
			{typeof children === 'function' ? children({ isActive: active }) : children}
			{isExternal && (
				<>
					<span className="select-none" aria-hidden="true">
						&#8288;
					</span>
					<ArrowUpRight className="group-hover/link:text-primary text-muted ExternalLinkIcon mt-external-link-icon absolute ml-[.125em] inline-block size-[1em] no-underline transition duration-[inherit] ease-[inherit] group-hover/link:-translate-y-px group-hover/link:translate-x-px" />
				</>
			)}
		</a>
	)
}
