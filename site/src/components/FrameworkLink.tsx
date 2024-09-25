import { toFrameworkPath, type Framework } from '@/lib/framework'
import * as React from 'react'

export default function FrameworkLink({
	href,
	children,
	...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
	const ref = React.useRef<HTMLAnchorElement>(null)
	// This is gross but not sure a better way:
	React.useEffect(() => {
		const savedFramework = localStorage.getItem('framework') as Framework | undefined
		if (!savedFramework) return
		ref.current?.setAttribute('href', toFrameworkPath(href, savedFramework)!)
	}, [])

	return (
		<a {...props} ref={ref}>
			{children}
		</a>
	)
}
