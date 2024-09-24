import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { FRAMEWORKS, toFrameworkPath, type Framework } from '@/lib/framework'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import * as React from 'react'
import { CheckIcon } from '@heroicons/react/20/solid'

const icons = import.meta.glob<React.FC<React.HTMLAttributes<SVGElement>>>(
	'./icons/frameworks/*.tsx',
	{
		import: 'default',
		eager: true
	}
)

export default function FrameworkMenu({ value, url }: { value: Framework; url: URL }) {
	const ValueIcon = icons[`./icons/frameworks/${value}.tsx`]!

	return (
		<Menu>
			<MenuButton className="flex items-center rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-50 transition duration-[.16s] ease-out hover:brightness-125 active:brightness-[98%] active:duration-[25ms]">
				<ValueIcon className="size-4.5 mr-2 shrink-0" />
				{FRAMEWORKS[value].name}
				<ChevronDownIcon className="ml-1.5 h-3 shrink-0 opacity-50" strokeWidth={2} />
			</MenuButton>
			<MenuItems
				anchor={{ to: 'bottom start', gap: '0.375rem' }}
				className="min-w-32 rounded-xl bg-zinc-900 p-1"
			>
				{Object.entries(FRAMEWORKS).map(([id, framework]) => {
					const Icon = icons[`./icons/frameworks/${id}.tsx`]!
					return (
						<MenuItem
							key={id}
							as="a"
							disabled={id === value}
							className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium data-[disabled]:cursor-default data-[focus]:bg-zinc-800"
							href={toFrameworkPath(url.pathname, id as Framework)}
						>
							<Icon className="size-4.5" />
							{framework.name}
							{id === value && <CheckIcon className="ml-auto h-4 w-4" />}
						</MenuItem>
					)
				})}
			</MenuItems>
		</Menu>
	)
}
