import * as React from 'react'
// import { atom, useAtom } from 'jotai'
import { clsx } from 'clsx/lite'
import { inView, motion, MotionConfig } from 'motion/react'
import { useId } from 'react'
import {
	MenuTrigger,
	Button,
	Popover,
	Menu,
	MenuItem,
	Switch,
	Tabs,
	TabList,
	Tab,
	TabPanel
} from 'react-aria-components'
import { Check, ChevronDown } from 'lucide-react'
import AnimateHeightFragment from './AnimateHeightFragment'
import { Freeze } from './Freeze'

type TabValue = 'preview' | 'code'

export type DemoProps = {
	children: React.ReactNode
	className?: string
	rootClassName?: string
	defaultValue?: TabValue
	code?: React.ReactNode
	minHeight?: string
	title?: React.ReactNode
}

type Props = DemoProps & {
	onClick?: () => void
	onIntersect?: (entry: IntersectionObserverEntry) => void
	ref?: React.Ref<HTMLDivElement>
}

export default function Demo({
	children,
	rootClassName,
	className,
	defaultValue = 'preview',
	code,
	title,
	onClick,
	onIntersect,
	minHeight = 'min-h-[20rem]',
	ref
}: Props) {
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

	const demoRef = React.useRef<HTMLDivElement>(null)
	React.useEffect(() => {
		if (!onIntersect || !demoRef.current) return
		return inView(demoRef.current, (e) => {
			onIntersect(e)
			return onIntersect
		})
	}, [onIntersect])

	return (
		<AnimateHeightFragment dependencies={[active]}>
			<Tabs
				ref={ref}
				className={clsx(
					active === 'code' && 'dark',
					rootClassName,
					'Demo text-primary not-prose border-faint relative isolate overflow-clip rounded-lg border',
					active === 'code' && 'bg-zinc-950 dark:bg-zinc-900'
				)} // reset text color if inside prose
				selectedKey={active}
				onSelectionChange={(key) => setActive(key as TabValue)}
			>
				{code && (
					<MotionConfig transition={{ layout: { type: 'spring', duration: 0.25, bounce: 0 } }}>
						<TabList className="bg-zinc-150/90 absolute right-3 top-3 z-10 flex gap-1 rounded-full p-1 backdrop-blur-lg dark:bg-black/60">
							<Tab
								id="preview"
								className="dark:text-muted data-[hovered]:text-primary aria-selected:text-primary relative cursor-default rounded-full px-2 py-1 text-xs/4 font-medium text-zinc-600"
							>
								{active === 'preview' && (
									<motion.div
										className="prefers-dark:!bg-white/15 absolute inset-0 -z-10 size-full bg-white shadow-sm dark:bg-white/25"
										style={{ borderRadius: 999 }}
										layout
										layoutId={`${id}active`}
									></motion.div>
								)}
								Preview
							</Tab>
							<Tab
								id="code"
								className="dark:text-muted data-[hovered]:text-primary aria-selected:text-primary relative cursor-default rounded-full px-2 py-1 text-xs/4 font-medium text-zinc-600"
							>
								{active === 'code' && (
									<motion.div
										className="prefers-dark:!bg-white/15 absolute inset-0 -z-10 size-full bg-white shadow-sm dark:bg-white/25"
										style={{ borderRadius: 999 }}
										layout
										layoutId={`${id}active`}
									></motion.div>
								)}
								Code
							</Tab>
						</TabList>
					</MotionConfig>
				)}
				<TabPanel
					id="preview"
					shouldForceMount
					className={clsx(className, 'relative data-[inert]:hidden')}
				>
					{title && <div className="absolute left-3 top-3">{title}</div>}
					<div
						className={clsx(
							minHeight,
							'flex flex-col items-center justify-center p-5 pb-6 [&_button]:cursor-pointer'
						)}
						ref={demoRef}
						onClick={onClick && handleClick}
						onMouseDown={onClick && handleMouseDown}
					>
						{children}
						{onClick && (
							<span
								className={clsx(
									'text-muted absolute bottom-5 left-0 w-full text-center text-sm transition-opacity duration-200 ease-out',
									knowsToClick && 'opacity-0'
								)}
							>
								<span className="can-hover:inline hidden">Click</span>
								<span className="can-hover:hidden">Tap</span> anywhere to change numbers
							</span>
						)}
					</div>
				</TabPanel>
				{code && (
					// Pad the right side of the first line to make room for tabs:
					<TabPanel
						className="[&_.line:first-child]:pr-[9.75rem] [&_pre]:!rounded-none [&_pre]:!border-none"
						id="code"
					>
						{code}
					</TabPanel>
				)}
			</Tabs>
		</AnimateHeightFragment>
	)
}

export function DemoTitle({
	className,
	children,
	...rest
}: JSX.IntrinsicElements['span'] & { children: string }) {
	return (
		<span {...rest} className={clsx(className, 'px-2 py-1.5 text-sm')}>
			{children}
		</span>
	)
}

export function DemoMenu({ children }: { children: React.ReactNode }) {
	return <MenuTrigger>{children}</MenuTrigger>
}

export function DemoMenuButton({
	children,
	className
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<Button
			className={clsx(
				className,
				'btn-secondary group flex h-8 items-center rounded-md pe-2 ps-2.5 text-xs transition duration-[.16s] ease-[cubic-bezier(.4,0,.2,1)]'
			)}
		>
			{children}
			<ChevronDown
				className="spring-bounce-0 spring-duration-150 ml-0.5 size-3.5 shrink-0 group-aria-expanded:rotate-180"
				strokeWidth={2}
			/>
		</Button>
	)
}

export function DemoMenuItems({
	className,
	children
}: {
	className?: string
	children: React.ReactNode
}) {
	return (
		<Popover
			placement="bottom start"
			offset={6}
			className={clsx(
				className,
				'origin-top-left rounded-lg bg-white p-1.5 shadow-sm ring ring-inset ring-black/[8%] transition-[opacity,transform] duration-[.12s] ease-out data-[entering]:scale-[.96] data-[exiting]:scale-[.96] data-[entering]:opacity-0 data-[exiting]:opacity-0 dark:bg-zinc-950 dark:shadow-none dark:ring-white/10'
			)}
		>
			{({ isExiting }) => (
				<Freeze frozen={isExiting}>
					<Menu>{children}</Menu>
				</Freeze>
			)}
		</Popover>
	)
}

export function DemoMenuItem({
	className,
	children,
	isDisabled,
	onAction,
	textValue
}: {
	className?: string
	children: React.ReactNode
	isDisabled?: boolean
	onAction?: () => void
	textValue?: string
}) {
	return (
		<MenuItem
			isDisabled={isDisabled}
			onAction={onAction}
			textValue={textValue}
			className={clsx(
				className,
				'dark:data-[focused]:bg-white/12.5 grid w-full cursor-default grid-cols-[1fr_1rem] items-center gap-2 rounded-lg p-2 text-xs font-medium data-[focused]:bg-black/5'
			)}
		>
			{children}
			{isDisabled && <Check className="ml-auto h-4 w-4" />}
		</MenuItem>
	)
}

export function DemoSwitch({
	className,
	children,
	isSelected,
	onChange
}: {
	className?: string
	children: React.ReactNode
	isSelected?: boolean
	onChange?: (isSelected: boolean) => void
}) {
	return (
		<Switch
			isSelected={isSelected}
			onChange={onChange}
			className={clsx(
				className,
				'group flex items-center gap-2 p-1 data-[focus-visible]:outline-none'
			)}
		>
			<div className="dark:group-data-[hovered]:bg-zinc-750 p-0.75 relative flex h-6 w-10 shrink-0 rounded-full bg-zinc-200 transition-colors duration-200 ease-in-out group-data-[hovered]:bg-zinc-300 group-data-[selected]:bg-zinc-950 group-data-[selected]:group-data-[hovered]:bg-zinc-700 group-data-[focus-visible]:outline dark:bg-zinc-800 dark:group-data-[selected]:bg-zinc-50 dark:group-data-[selected]:group-data-[hovered]:bg-zinc-300">
				<span
					aria-hidden="true"
					className="spring-bounce-0 spring-duration-200 size-4.5 pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-transform group-data-[selected]:translate-x-4 dark:bg-zinc-950"
				/>
			</div>
			<span className="text-xs">{children}</span>
		</Switch>
	)
}
