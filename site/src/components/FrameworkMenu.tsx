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
	const ValueIcon = icons[`./icons/frameworks/${value}.tsx`]!

	return (
		<Menu>
			<MenuButton
				className={clsx(
					className,
					'group -mx-3 -my-3 inline-flex items-center rounded-full px-3 py-2 font-medium text-zinc-50 transition duration-[.16s] ease-out hover:brightness-125 active:brightness-[98%] active:duration-[25ms]'
				)}
			>
				<ValueIcon className="size-4.5 mr-2 shrink-0" />
				{FRAMEWORKS[value].name}
				<ChevronDown
					className="spring-bounce-0 spring-duration-150 ml-1 size-4 shrink-0 group-data-[active]:rotate-180"
					strokeWidth={2}
				/>
			</MenuButton>
			<MenuItems
				anchor={{ to: 'bottom start', offset: '-0.125rem' }}
				className="animate-pop-in min-w-32 origin-top-left rounded-xl bg-zinc-950/90 p-1.5 ring ring-inset ring-white/[8%] backdrop-blur-xl backdrop-saturate-[140%]"
			>
				{Object.entries(FRAMEWORKS).map(([id, framework]) => {
					const Icon = icons[`./icons/frameworks/${id}.tsx`]!
					return (
						<MenuItem
							key={id}
							as="a"
							disabled={id === value}
							onClick={() => void localStorage.setItem('framework', id)}
							className="data-[focus]:bg-white/12.5 flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium data-[disabled]:cursor-default"
							href={toFrameworkPath(url.pathname, id as Framework)}
						>
							<Icon className="size-4.5" />
							{framework.name}
							{id === value && <Check className="ml-auto h-4 w-4" />}
						</MenuItem>
					)
				})}
			</MenuItems>
		</Menu>
	)
}
