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

export type Justify = 'left' | 'right'

// Makeshift .offsetRight
export const offset = (el: HTMLElement, justify: Justify) => {
	return justify === 'left'
		? el.offsetLeft
		: ((el.offsetParent instanceof HTMLElement ? el.offsetParent : null)?.offsetWidth ?? 0) -
				el.offsetWidth -
				el.offsetLeft
}

export const visible = (el: HTMLElement) => el.offsetWidth > 0 && el.offsetHeight > 0
