import * as React from 'react'
import { useStore } from '@nanostores/react'
import { urlAtom, pageFrameworkAtom } from '@/stores/url'
import type { AnchorHTMLAttributes } from 'react'
import { isActive } from '../lib/url'
import { toFrameworkPath } from '@/lib/framework'

export type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
	frameworked?: boolean
	active?: React.ReactNode
}

export default function Link({
	href: _href,
	children,
	frameworked = true,
	active: activeChildren,
	...props
}: Props) {
	const pageFramework = useStore(pageFrameworkAtom)
	const url = useStore(urlAtom)

	const href = frameworked ? toFrameworkPath(_href, pageFramework) : _href

	const active = isActive(href, url)
	return (
		<a {...props} data-active={active ? '' : undefined} href={href}>
			{active && activeChildren}
			{children}
		</a>
	)
}
