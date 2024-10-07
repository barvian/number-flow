import * as React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
// import { atom, useAtom } from 'jotai'
import { clsx } from 'clsx/lite'
import { motion, MotionConfig } from 'framer-motion'
import { useId } from 'react'

type TabValue = 'preview' | 'code'

export type DemoProps = {
	children: React.ReactNode
	className?: string
	prose?: boolean
	defaultValue?: TabValue
	code?: React.ReactNode
	title?: React.ReactNode
}

// const knowsToClickAtom = atom(false)

export default function Demo({
	children,
	className,
	prose = false,
	defaultValue = 'preview',
	code,
	title,
	onClick
}: DemoProps & { onClick?: () => void }) {
	// const [knowsToClick, setKnowsToClick] = useAtom(knowsToClickAtom)
	const [knowsToClick, setKnowsToClick] = React.useState(false)
	const [active, setActive] = React.useState(defaultValue)

	const id = useId()

	function handleClick() {
		setKnowsToClick(true)
		onClick?.()
	}
	function handleMouseDown(event: React.MouseEvent<HTMLElement>) {
		// Prevent selection of text:
		// https://stackoverflow.com/a/43321596
		if (event.detail > 1) {
			event.preventDefault()
		}
	}

	return (
		<Tabs.Root
			className={clsx(
				!prose && 'text-primary not-prose',
				active === 'code' && 'dark',
				'relative isolate'
			)} // reset text color if inside prose
			value={active}
			onValueChange={(val) => setActive(val as TabValue)}
		>
			{code && (
				<MotionConfig transition={{ layout: { type: 'spring', duration: 0.25, bounce: 0 } }}>
					<Tabs.List className="bg-zinc-150/90 absolute right-3 top-3 z-10 flex gap-1 rounded-full p-1 backdrop-blur-lg dark:bg-black/60">
						<Tabs.Trigger
							value="preview"
							className={clsx(
								active !== 'preview' && 'hover:transition-[color]',
								'dark:text-muted hover:text-primary aria-selected:text-primary relative px-2 py-1 text-xs/4 font-medium text-zinc-600'
							)}
						>
							{active === 'preview' && (
								<motion.div
									className="prefers-dark:dark:bg-white/20 absolute inset-0 -z-10 size-full bg-white shadow-sm dark:bg-white/25"
									style={{ borderRadius: 999 }}
									layout
									layoutId={`${id}active`}
								></motion.div>
							)}
							Preview
						</Tabs.Trigger>
						<Tabs.Trigger
							value="code"
							className={clsx(
								active !== 'code' && 'hover:transition-[color]',
								'dark:text-muted hover:text-primary aria-selected:text-primary relative px-2 py-1 text-xs/4 font-medium text-zinc-600'
							)}
						>
							{active === 'code' && (
								<motion.div
									className="prefers-dark:dark:bg-white/20 absolute inset-0 -z-10 size-full bg-white shadow-sm dark:bg-white/25"
									style={{ borderRadius: 999 }}
									layout
									layoutId={`${id}active`}
								></motion.div>
							)}
							Code
						</Tabs.Trigger>
					</Tabs.List>
				</MotionConfig>
			)}
			<Tabs.Content
				value="preview"
				className={clsx(
					className,
					'relative flex min-h-[20rem] flex-col items-center justify-center rounded-lg border border-zinc-200 p-5 pb-6 data-[state=inactive]:hidden dark:border-zinc-800'
				)}
				onClick={onClick && handleClick}
				onMouseDown={onClick && handleMouseDown}
			>
				{title && <div className="top-4.5 absolute left-5 text-sm">{title}</div>}
				{children}
				{onClick && (
					<span
						className={clsx(
							'text-muted absolute bottom-5 left-0 w-full text-center text-sm transition-opacity duration-200 ease-out',
							knowsToClick && 'opacity-0'
						)}
					>
						Click anywhere to change numbers
					</span>
				)}
			</Tabs.Content>
			{code && <Tabs.Content value="code">{code}</Tabs.Content>}
		</Tabs.Root>
	)
}
