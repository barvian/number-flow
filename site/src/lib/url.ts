import { DEFAULT_FRAMEWORK, toFrameworkPath } from './framework'

const _isActive = (path: string | undefined, urlOrPathname: URL | string | undefined) => {
	if (!path || !urlOrPathname) return false
	const currentPath = typeof urlOrPathname === 'string' ? urlOrPathname : urlOrPathname.pathname
	if (currentPath === path || currentPath.startsWith(path + '/')) return true
	return false
}

export const isActive = (
	path: string | undefined,
	urlOrPathname: URL | Location | string | undefined
) =>
	_isActive(
		toFrameworkPath(path, DEFAULT_FRAMEWORK),
		toFrameworkPath(urlOrPathname, DEFAULT_FRAMEWORK)
	)

export const trimSlash = (path: string | undefined) => path?.replace(/(.)\/$/, '$1')
