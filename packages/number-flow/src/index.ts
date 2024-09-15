import { createElement, type HTMLProps } from './util/dom'
import { forEach } from './util/iterable'
import {
	formatToParts,
	type KeyedDigitPart,
	type KeyedNumberPart,
	type KeyedSymbolPart,
	type Format,
	type Value
} from './formatter'
import { ServerSafeHTMLElement } from './ssr'
import styles from './styles'
export { renderInnerHTML } from './ssr'
export type * from './formatter'

const OBSERVED_ATTRIBUTES = ['value', 'timing'] as const
type ObservedAttribute = (typeof OBSERVED_ATTRIBUTES)[number]

const DEFAULT_TIMING: EffectTiming = {
	duration: 1
}

type Args = Value | [Value, locales?: Intl.LocalesArgument, format?: Format]

let styleSheet: CSSStyleSheet | undefined

class NumberFlow extends ServerSafeHTMLElement {
	static observedAttributes = OBSERVED_ATTRIBUTES

	timing = DEFAULT_TIMING
	#formatted?: string

	attributeChangedCallback(attr: ObservedAttribute, _oldValue: string, newValue: string) {
		this[attr] = JSON.parse(newValue)
	}

	get value(): string | undefined {
		return this.#formatted
	}

	#created = false
	#pre?: Section
	#integer?: Section
	#fraction?: Section
	#post?: Section
	#label?: HTMLSpanElement

	set value(newVal: Args | undefined) {
		if (newVal == null) {
			this.#formatted = undefined
			return
		}

		const { pre, integer, fraction, post, formatted } = Array.isArray(newVal)
			? formatToParts(...newVal)
			: formatToParts(newVal)

		this.#label!.textContent = formatted

		// Initialize if needed
		if (!this.#created) {
			// Don't check for declarative shadow DOM because we'll recreate it anyway:
			this.attachShadow({ mode: 'open' })

			// Add stylesheet
			if (typeof CSSStyleSheet !== 'undefined' && this.shadowRoot!.adoptedStyleSheets) {
				if (!styleSheet) {
					styleSheet = new CSSStyleSheet()
					styleSheet.replaceSync(styles)
				}
				this.shadowRoot!.adoptedStyleSheets = [styleSheet]
			} else {
				const style = document.createElement('style')
				style.textContent = styles
				this.shadowRoot!.appendChild(style)
			}

			this.#label = createElement('span', { className: 'label' })
			this.shadowRoot!.appendChild(this.#label)

			this.#pre = new Section(this, pre, {
				part: 'pre',
				inert: true,
				ariaHidden: 'true',
				justify: 'right',
				exitMode: 'pop'
			})
			this.shadowRoot!.appendChild(this.#pre.el)
			this.#integer = new Section(this, integer, {
				part: 'integer',
				inert: true,
				ariaHidden: 'true',
				justify: 'right',
				exitMode: 'sync'
			})
			this.shadowRoot!.appendChild(this.#integer.el)
			this.#fraction = new Section(this, fraction, {
				part: 'fraction',
				inert: true,
				ariaHidden: 'true',
				justify: 'left',
				exitMode: 'sync'
			})
			this.shadowRoot!.appendChild(this.#fraction.el)
			this.#post = new Section(this, post, {
				part: 'post',
				inert: true,
				ariaHidden: 'true',
				justify: 'left',
				exitMode: 'pop'
			})
			this.shadowRoot!.appendChild(this.#post.el)
		} else {
			// Update otherwise:
			const sectionFlips: ReturnType<(typeof Section)['prototype']['update']>[] = []
			sectionFlips.push(this.#pre!.update(pre))
			sectionFlips.push(this.#integer!.update(integer))
			sectionFlips.push(this.#fraction!.update(fraction))
			sectionFlips.push(this.#post!.update(post))
			sectionFlips.forEach((flip) => flip())
		}

		this.#formatted = formatted
		this.#created = true
	}
}

type Justify = 'left' | 'right'
type ExitMode = 'sync' | 'pop'

class Section {
	readonly el: HTMLDivElement
	#inner: HTMLDivElement
	readonly justify: Justify
	readonly exitMode: ExitMode

	// All children in the DOM:
	#children: Map<string, Char>

	constructor(
		readonly flow: NumberFlow,
		parts: KeyedNumberPart[],
		{ justify, exitMode, ...opts }: { justify: Justify; exitMode: ExitMode } & HTMLProps<'section'>
	) {
		this.justify = justify
		this.exitMode = exitMode

		this.#children = new Map()

		this.#inner = createElement(
			'div',
			{
				className: 'section__inner',
				// Zero width space prevents the height from collapsing when no chars:
				innerHTML: '&#8203;'
			},
			parts.map((part) => {
				const comp =
					part.type === 'integer' || part.type === 'fraction' ? new Digit(this) : new Sym(this)
				this.#children.set(part.key, comp)
				return comp.el
			})
		)

		this.el = createElement(
			'div',
			{
				...opts,
				className: `section section--justify-${justify}`
			},
			[this.#inner]
		)
	}

	update(parts: KeyedNumberPart[]) {
		const rect = this.el.getBoundingClientRect()
		const innerRect = this.#inner.getBoundingClientRect()

		// Find removed children
		this.#children.forEach((comp) => {
			if (!parts.find((p) => p.key === comp.part?.key)) {
				comp.el.remove()
				this.#children.delete(comp.part!.key)
			}
		})

		// Add or update other parts:
		const reverse = this.justify === 'right'
		const addOp = reverse ? 'prepend' : 'append'
		const charFlips: ReturnType<(typeof Char)['prototype']['update']>[] = []
		forEach(parts, reverse, (part) => {
			// If this child already exists, update it:
			if (this.#children.has(part.key)) {
				const comp = this.#children.get(part.key)!
				charFlips.push(comp.update(part))
			} else {
				// Otherwise, create a new one:
				const comp: Char =
					part.type === 'integer' || part.type === 'fraction' ? new Digit(this) : new Sym(this)
				charFlips.push(comp.update(part))
				this.#children.set(part.key, comp)

				this.#inner[addOp](comp.el)
			}
		})

		return () => {
			const newInnerRect = this.#inner.getBoundingClientRect()

			charFlips.forEach((flip) => flip(newInnerRect))
		}
	}
}

abstract class Char<P extends KeyedNumberPart = KeyedNumberPart> {
	protected _part?: P

	constructor(
		readonly section: Section,
		readonly el: HTMLSpanElement
	) {}

	get part(): P | undefined {
		return this._part
	}

	abstract update(part: P): (parentRect: DOMRect) => void
}

class Digit extends Char<KeyedDigitPart> {
	constructor(section: Section) {
		super(section, createElement('span', { part: 'digit' }))
	}

	#created = false

	update(part: KeyedDigitPart) {
		const prevVal = this._part?.value

		// @ts-expect-error wrong built-in DOM types
		this.el.part = `digit ${part.type} ${part.value}`
		if (!this.#created) {
			this.el.textContent = part.value + ''
			this.#created = true
		}
		this.el.textContent = part.value + ''

		this._part = part

		return (parentRect: DOMRect) => {
			const val = this._part!.value
		}
	}
}

class Sym extends Char<KeyedSymbolPart> {
	constructor(section: Section) {
		super(section, createElement('span', { part: 'symbol' }))
	}

	update(part: KeyedSymbolPart) {
		this.el.textContent = part.value
		this._part = part

		return (parentRect: DOMRect) => {}
	}
}

export default NumberFlow

if (NumberFlow && typeof window !== 'undefined' && !window.customElements.get('number-flow')) {
	customElements.define('number-flow', NumberFlow)
}
