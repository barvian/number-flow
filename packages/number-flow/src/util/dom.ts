type ExcludeReadonly<T> = {
	-readonly [K in keyof T as T[K] extends Readonly<any> ? never : K]: T[K]
}

export type HTMLProps<K extends keyof HTMLElementTagNameMap> = Partial<
	ExcludeReadonly<HTMLElementTagNameMap[K]> & { part: string }
>

export const createElement = <K extends keyof HTMLElementTagNameMap>(
	tagName: K,
	optionsOrChildren?: HTMLProps<K> | Node[],
	_children?: Node[]
): HTMLElementTagNameMap[K] => {
	const element = document.createElement(tagName)
	const [options, children] = Array.isArray(optionsOrChildren)
		? [undefined, optionsOrChildren]
		: [optionsOrChildren, _children]
	if (options) Object.assign(element, options)
	children?.forEach((child) => element.appendChild(child))
	return element
}

export const replaceChildren = (el: HTMLElement, children: Node[]) => {
	if (typeof Element.prototype.replaceChildren === 'undefined') {
		el.innerHTML = ''
		children.forEach((child) => el.appendChild(child))
	} else {
		el.replaceChildren(...children)
	}
}

export type Justify = 'left' | 'right'

// Makeshift .offsetRight
export const offset = (el: HTMLElement, justify: Justify) => {
	return justify === 'left'
		? el.offsetLeft
		: ((el.offsetParent instanceof HTMLElement ? el.offsetParent : null)?.offsetWidth ?? 0) -
				el.offsetWidth -
				el.offsetLeft
}
