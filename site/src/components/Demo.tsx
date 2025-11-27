import * as React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
// import { atom, useAtom } from 'jotai'
import { clsx } from 'clsx/lite'
import { inView, motion, MotionConfig } from 'motion/react'
import { useId } from 'react'
import {
	Menu,
	MenuButton,
	MenuItem,
	MenuItems,
	Switch,
	Field,
	Label,
	type SwitchProps,
	type MenuButtonProps,
	type MenuItemProps,
	type MenuItemsProps,
	type MenuProps
} from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import AnimateHeightFragment from './AnimateHeightFragment'

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
			<Tabs.Root
				ref={ref}
				className={clsx(
					active === 'code' && 'dark',
					rootClassName,
					'Demo text-primary not-prose border-faint relative isolate overflow-clip rounded-lg border',
					active === 'code' && 'bg-zinc-950 dark:bg-zinc-900'
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
										className="prefers-dark:!bg-white/15 absolute inset-0 -z-10 size-full bg-white shadow-sm dark:bg-white/25"
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
										className="prefers-dark:!bg-white/15 absolute inset-0 -z-10 size-full bg-white shadow-sm dark:bg-white/25"
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
					forceMount
					className={clsx(className, 'relative data-[state=inactive]:hidden')}
				>
					{title && <div className="absolute left-3 top-3">{title}</div>}
					<div
						className={clsx(minHeight, 'flex flex-col items-center justify-center p-5 pb-6')}
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
				</Tabs.Content>
				{code && (
					// Pad the right side of the first line to make room for tabs:
					<Tabs.Content
						className="[&_.line:first-child]:pr-[9.75rem] [&_pre]:!rounded-none [&_pre]:!border-none"
						value="code"
					>
						{code}
					</Tabs.Content>
				)}
			</Tabs.Root>
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

export function DemoMenu(props: MenuProps) {
	return <Menu {...props} />
}

export function DemoMenuButton({
	children,
	className,
	...props
}: MenuButtonProps & { children: React.ReactNode }) {
	return (
		<MenuButton
			{...props}
			className={clsx(
				className,
				'btn-secondary group flex h-8 items-center rounded-md px-2 text-xs transition duration-[.16s] ease-[cubic-bezier(.4,0,.2,1)]'
			)}
		>
			{children}
			<ChevronDown
				className="spring-bounce-0 spring-duration-150 ml-0.5 size-3.5 shrink-0 group-data-[open]:rotate-180"
				strokeWidth={2}
			/>
		</MenuButton>
	)
}

export function DemoMenuItems({ className, ...props }: MenuItemsProps) {
	return (
		<MenuItems
			{...props}
			className={clsx(
				className,
				'animate-pop-in absolute left-0 top-full z-10 mt-1.5 min-w-full origin-top-left rounded-lg bg-white p-1.5 shadow-sm ring ring-inset ring-black/[8%] dark:bg-zinc-950 dark:shadow-none dark:ring-white/10'
			)}
		/>
	)
}

export function DemoMenuItem({
	className,
	children,
	...props
}: MenuItemProps<'button'> & { children: React.ReactNode }) {
	return (
		<MenuItem
			{...props}
			as="button"
			className={clsx(
				className,
				props.disabled ? 'pr-2' : 'pr-4',
				'dark:data-[focus]:bg-white/12.5 flex w-full items-center gap-2 rounded-lg py-2 pl-2 text-xs font-medium data-[disabled]:cursor-default data-[focus]:bg-black/5'
			)}
		>
			{children}
			{props.disabled && <Check className="ml-auto h-4 w-4" />}
		</MenuItem>
	)
}

export function DemoSwitch({
	className,
	children,
	...props
}: SwitchProps & { children: React.ReactNode }) {
	return (
		<Field className="">
			<Label className="flex items-center gap-2 p-1">
				<Switch
					{...props}
					className={clsx(
						className,
						'dark:hover:bg-zinc-750 p-0.75 group relative flex h-6 w-10 rounded-full bg-zinc-200 transition-colors duration-200 ease-in-out hover:bg-zinc-300 focus:outline-none data-[checked]:bg-zinc-950 data-[focus]:outline-2 data-[focus]:outline-blue-500 data-[checked]:hover:bg-zinc-700 dark:bg-zinc-800 dark:data-[checked]:bg-zinc-50 dark:data-[checked]:hover:bg-zinc-300'
					)}
				>
					<span
						aria-hidden="true"
						className="spring-bounce-0 spring-duration-200 size-4.5 pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-transform group-data-[checked]:translate-x-4 dark:bg-zinc-950"
					/>
				</Switch>
				<span className="text-xs">{children}</span>
			</Label>
		</Field>
	)
}
