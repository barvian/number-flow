import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { FRAMEWORKS, toFrameworkPath, type Framework } from '@/lib/framework'
import { ChevronDown } from 'lucide-react'
import * as React from 'react'
import { Check } from 'lucide-react'
import clsx from 'clsx/lite'

const icons = import.meta.glob<React.FC<React.HTMLAttributes<SVGElement>>>(
	'./icons/frameworks/*.tsx',
	{
		import: 'default',
		eager: true
	}
)

export default function FrameworkMenu({
	value,
	url,
	className
}: {
	value: Framework
	url: URL
	className?: string
}) {
	const Icon = icons[`./icons/frameworks/${value}.tsx`]!

	return (
		<Menu>
			<MenuButton
				className={clsx(
					className,
					'text-primary btn-secondary group -mx-1 -my-1 -mr-3.5 inline-flex items-baseline rounded-lg px-2 py-1 pr-1.5 font-medium transition duration-[.16s] ease-out'
				)}
			>
				<Icon className="size-4.5 relative me-1.5 shrink-0 self-center" />
				{FRAMEWORKS[value].name}
				<ChevronDown
					className="spring-bounce-0 spring-duration-150 ml-1 size-4 shrink-0 self-center group-data-[open]:rotate-180"
					strokeWidth={2}
				/>
			</MenuButton>
			<MenuItems
				anchor={{ to: 'bottom start', offset: '-0.375rem' }}
				className="animate-pop-in mt-1.5 min-w-32 origin-top-left rounded-xl bg-white p-1.5 shadow-sm ring ring-black/[8%] dark:bg-zinc-950 dark:ring-inset dark:ring-white/10"
			>
				{Object.entries(FRAMEWORKS).map(([id, framework]) => {
					const Icon = icons[`./icons/frameworks/${id}.tsx`]!
					return (
						<MenuItem
							key={id}
							as="a"
							disabled={id === value}
							className={clsx(
								id === value ? 'pr-2' : 'pr-4',
								'dark:data-[focus]:bg-white/12.5 text-primary flex items-center gap-1.5 rounded-lg py-2 pl-2 text-sm font-medium data-[disabled]:cursor-default data-[focus]:bg-black/[8%]'
							)}
							href={toFrameworkPath(url.pathname, id as Framework)}
						>
							<Icon className="size-4.5" />
							{framework.name}
							{id === value && <Check className="ml-auto h-4 w-4" strokeWidth={2.5} />}
						</MenuItem>
					)
				})}
			</MenuItems>
		</Menu>
	)
}
