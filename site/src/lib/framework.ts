import { trimSlash } from './url'

export type FrameworkData = {
	name: string | undefined
	sandbox: string
	lightColor: string
	darkColor: string
}

export const FRAMEWORKS = {
	react: {
		name: 'React',
		sandbox: 'https://codesandbox.io/p/sandbox/r47dcw',
		lightColor: '#0A7EA4',
		darkColor: '#58C4DC'
	},
	vue: {
		name: 'Vue',
		sandbox: 'https://stackblitz.com/edit/vitejs-vite-4prbhc?file=src%2FApp.vue',
		lightColor: '#42B883',
		darkColor: '#42B883'
	},
	svelte: {
		name: 'Svelte',
		sandbox:
			'https://codesandbox.io/p/devbox/number-flow-svelte-xshsw4?file=%2Fsrc%2Froutes%2F%2Bpage.svelte',
		lightColor: '#FF3E00',
		darkColor: '#F96844'
	}
	// vanilla: {
	// 	name: 'Vanilla',
	// 	lightColor: '#F7DF1E',
	// 	darkColor: '#F7DF1E'
	// }
} satisfies Record<string, FrameworkData>

export type Framework = keyof typeof FRAMEWORKS

export const DEFAULT_FRAMEWORK: Framework = 'react'

export const getFramework = (params: Record<string, string | undefined>) =>
	'framework' in params ? ((params.framework as Framework) ?? DEFAULT_FRAMEWORK) : null

export const getStaticPaths = () =>
	Object.keys(FRAMEWORKS).map((id) => ({
		params: { framework: id === DEFAULT_FRAMEWORK ? undefined : id }
	}))

export const toFrameworkPath = (
	urlOrPathname?: string | URL | Location | null,
	id?: Framework | false | null
) => {
	if (!urlOrPathname) return
	const path = typeof urlOrPathname === 'string' ? urlOrPathname : urlOrPathname.pathname
	if (!id) return path
	const [_, firstSegment, ...segments] = path.split('/')

	// New prefix to prepend, based on new framework:
	const prefix = id === DEFAULT_FRAMEWORK ? '' : '/' + id

	if (firstSegment && Object.keys(FRAMEWORKS).includes(firstSegment)) {
		return trimSlash(prefix + '/' + segments.join('/'))
	}
	// It was on the default framework
	return trimSlash(prefix + path)
}
