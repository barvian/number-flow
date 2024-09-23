export const FRAMEWORKS: Record<string, string> = {
	react: 'React',
	vue: 'Vue',
	web: 'Web'
}

export const getFramework = (param?: string) => param ?? 'react'
