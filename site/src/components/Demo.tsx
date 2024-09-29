import * as React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
// import { atom, useAtom } from 'jotai'
import { clsx } from 'clsx'
import { motion, MotionConfig } from 'framer-motion'
import { useId } from 'react'

type TabValue = 'preview' | 'code'

export type DemoProps = {
	children: React.ReactNode
	className?: string
	defaultValue?: TabValue
	code: React.ReactNode
	title?: React.ReactNode
}

// const knowsToClickAtom = atom(false)

export default function Demo({
	children,
	className,
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
		if (!onClick) return
		setKnowsToClick(true)
		onClick()
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
			className="not-prose relative isolate"
			value={active}
			onValueChange={(val) => setActive(val as TabValue)}
		>
			<MotionConfig transition={{ layout: { type: 'spring', duration: 0.25, bounce: 0 } }}>
				<Tabs.List className="absolute right-3 top-3 z-10 flex gap-1 rounded-full bg-black/60 p-1 backdrop-blur-lg">
					<Tabs.Trigger
						value="preview"
						className="relative px-2 py-1 text-xs/4 font-medium text-zinc-200 transition-[color] hover:text-white aria-selected:text-white"
					>
						{active === 'preview' && (
							<motion.div
								className="bg-white/12.5 absolute inset-0 size-full"
								style={{ borderRadius: 999 }}
								layout
								layoutId={`${id}active`}
							></motion.div>
						)}
						Preview
					</Tabs.Trigger>
					<Tabs.Trigger
						value="code"
						className="relative px-2 py-1 text-xs/4 font-medium text-zinc-200 transition-[color] hover:text-white aria-selected:text-white"
					>
						{active === 'code' && (
							<motion.div
								className="bg-white/12.5 absolute inset-0 size-full"
								style={{ borderRadius: 999 }}
								layout
								layoutId={`${id}active`}
							></motion.div>
						)}
						Code
					</Tabs.Trigger>
				</Tabs.List>
			</MotionConfig>
			<Tabs.Content
				value="preview"
				className={clsx(
					className,
					'relative flex min-h-[20rem] items-center justify-center rounded-lg bg-zinc-950 p-5 pb-6 text-zinc-50 data-[state=inactive]:hidden dark:border dark:border-zinc-800'
				)}
				onClick={handleClick}
				onMouseDown={handleMouseDown}
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
			<Tabs.Content value="code">{code}</Tabs.Content>
		</Tabs.Root>
	)
}
