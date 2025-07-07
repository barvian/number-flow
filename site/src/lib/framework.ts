import { trimSlash } from './url'

export type FrameworkData = {
	name: string | undefined
	pkgName: string
	componentType: string
	sandbox: string
	lightColor: string
	darkColor: string
}

export const FRAMEWORKS = {
	react: {
		name: 'React',
		pkgName: 'NumberFlow for React',
		componentType: 'React component',
		sandbox: 'https://codesandbox.io/p/sandbox/r47dcw',
		lightColor: '#0A7EA4',
		darkColor: '#58C4DC'
	},
	react_native: {
		name: 'React Native',
		pkgName: 'NumberFlow for React Native',
		componentType: 'React Native component',
		sandbox: '', // TODO: Add a CodeSandbox or Snack link for React Native
		lightColor: '#61DAFB', // React's color, often associated with RN too
		darkColor: '#61DAFB'
	},
	vue: {
		name: 'Vue',
		pkgName: 'NumberFlow for Vue',
		componentType: 'Vue component',
		sandbox: 'https://stackblitz.com/edit/vitejs-vite-4prbhc?file=src%2FApp.vue',
		lightColor: '#42B883',
		darkColor: '#42B883'
	},
	svelte: {
		name: 'Svelte',
		pkgName: 'NumberFlow for Svelte',
		componentType: 'Svelte component',
		sandbox: 'https://stackblitz.com/edit/vitejs-vite-5czxuc?file=src%2FApp.svelte',
		lightColor: '#FF3E00',
		darkColor: '#F96844'
	},
	vanilla: {
		name: 'Vanilla',
		pkgName: 'NumberFlow',
		componentType: 'web component',
		sandbox: 'https://stackblitz.com/edit/vitejs-vite-ec8hg3dz?file=index.html,src%2Fmain.ts',
		lightColor: '#F7DF1E',
		darkColor: '#F7DF1E'
	}
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
