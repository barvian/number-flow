type ExcludeReadonly<T> = {
	-readonly [K in keyof T as T[K] extends Readonly<any> ? never : K]: T[K]
}

export const ServerSafeHTMLElement =
	typeof window === 'undefined' || typeof HTMLElement === 'undefined'
		? (class {} as unknown as typeof HTMLElement)
		: HTMLElement

export type Em = `${number}em`
export function getWidthInEm(element: HTMLElement): Em {
	const { width, fontSize } = getComputedStyle(element)
	return `${parseFloat(width) / parseFloat(fontSize)}em`
}

export const createElement = <K extends keyof HTMLElementTagNameMap>(
	tagName: K,
	optionsOrChildren?: Partial<ExcludeReadonly<HTMLElementTagNameMap[K]>> | Node[],
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
