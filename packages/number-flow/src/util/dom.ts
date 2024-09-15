type ExcludeReadonly<T> = {
	-readonly [K in keyof T as T[K] extends Readonly<any> ? never : K]: T[K]
}

export type HTMLProps<K extends keyof HTMLElementTagNameMap> = Partial<
	ExcludeReadonly<HTMLElementTagNameMap[K]> & { part: string }
>

export type Em = `${number}em`
export function getEmWidth(element: HTMLElement): Em {
	const { width, fontSize } = getComputedStyle(element)
	return `${parseFloat(width) / parseFloat(fontSize)}em`
}

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
