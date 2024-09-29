export const isActive = (path: string | undefined, url: URL) => {
	if (!path) return false
	const currentPath = url.pathname
	if (currentPath === path || currentPath.startsWith(path + '/')) return true
	return false
}
