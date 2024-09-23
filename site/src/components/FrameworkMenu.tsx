import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { FRAMEWORKS } from '@/lib/framework'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import * as React from 'react'

const icons = import.meta.glob<React.FC<React.HTMLAttributes<SVGElement>>>(
	'./icons/frameworks/*.tsx',
	{
		import: 'default',
		eager: true
	}
)

export default function FrameworkMenu({ value }: { value: string }) {
	const ValueIcon = icons[`./icons/frameworks/${value}.tsx`]!

	return (
		<Menu>
			<MenuButton className="flex items-center rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-50 transition duration-[.16s] ease-out hover:brightness-125 active:brightness-[98%] active:duration-[25ms]">
				<ValueIcon className="size-4.5 mr-2 shrink-0" />
				{FRAMEWORKS[value]}
				<ChevronDownIcon className="ml-1.5 h-3 shrink-0 opacity-50" strokeWidth={2} />
			</MenuButton>
			<MenuItems anchor="bottom">
				{Object.entries(FRAMEWORKS).map(([id, name]) => {
					const Icon = icons[`./icons/frameworks/${id}.tsx`]!
					return (
						<MenuItem as="a" className="flex data-[focus]:bg-blue-100" href="/settings">
							<Icon className="size-4.5" />
							{name}
						</MenuItem>
					)
				})}
			</MenuItems>
		</Menu>
	)
}
