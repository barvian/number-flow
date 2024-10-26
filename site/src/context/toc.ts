import { createContext } from '@astropub/context'
import GitHubSlugger from 'github-slugger'

// type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type Heading = { title: string; id: string }

export const [TOCProvider, getTOCContext] = createContext<{
	headings: Heading[]
	slugger: GitHubSlugger
}>()
