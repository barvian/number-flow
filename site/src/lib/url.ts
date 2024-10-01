export const isActive = (path: string | undefined, urlOrPathname: URL | string | undefined) => {
	if (!path || !urlOrPathname) return false
	const currentPath = typeof urlOrPathname === 'string' ? urlOrPathname : urlOrPathname.pathname
	if (currentPath === path || currentPath.startsWith(path + '/')) return true
	return false
}
