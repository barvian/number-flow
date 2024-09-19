import { createElement, replaceChildren, type HTMLProps } from './util/dom'
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
import { frames, lerp, discreteFrames, type DiscreteKeyframeProps } from './util/animate'
import { BROWSER } from 'esm-env'
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
				masked: true,
				ariaHidden: 'true',
				justify: 'right',
				exitMode: 'sync'
			})
			this.shadowRoot!.appendChild(this.#integer.el)
			this.#fraction = new Section(this, fraction, {
				part: 'fraction',
				inert: true,
				masked: true,
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
			// Update otherwise
			this.#pre!.willUpdate()
			this.#integer!.willUpdate()
			this.#fraction!.willUpdate()
			this.#post!.willUpdate()

			this.#pre!.update(pre)
			this.#integer!.update(integer)
			this.#fraction!.update(fraction)
			this.#post!.update(post)

			this.#pre!.didUpdate()
			this.#integer!.didUpdate()
			this.#fraction!.didUpdate()
			this.#post!.didUpdate()
		}

		this.#label!.textContent = formatted

		this.#formatted = formatted
		this.#created = true
	}
}

type Justify = 'left' | 'right'
type ExitMode = 'sync' | 'pop'

class Section {
	readonly el: HTMLSpanElement
	readonly #inner?: HTMLSpanElement
	readonly justify: Justify
	readonly exitMode: ExitMode
	readonly masked: boolean

	// A shortcut to #inner or el:
	readonly #wrapper: HTMLSpanElement

	// All children in the DOM:
	#children: Map<string, Char>

	constructor(
		readonly flow: NumberFlow,
		parts: KeyedNumberPart[],
		{
			justify,
			exitMode,
			masked = false,
			...opts
		}: { justify: Justify; exitMode: ExitMode; masked?: boolean } & HTMLProps<'section'>
	) {
		this.justify = justify
		this.exitMode = exitMode
		this.masked = masked

		this.#children = new Map()

		// Zero width space prevents the height from collapsing when no chars
		// TODO: replace this with height: 1lh when it's better supported:
		const innerHTML = '&#8203;'

		if (masked)
			this.#inner = createElement(
				'span',
				{
					className: 'section__inner',
					innerHTML
				},
				parts.map((part) => {
					const comp =
						part.type === 'integer' || part.type === 'fraction'
							? new Digit(this, part.type, part.value)
							: new Sym(this, part.type, part.value)
					this.#children.set(part.key, comp)
					return comp.el
				})
			)

		this.el = createElement(
			'span',
			{
				...opts,
				className: `section section--justify-${justify}${masked ? ' section--masked' : ''}`,
				...(this.#inner ? {} : { innerHTML })
			},
			this.#inner && [this.#inner]
		)
		this.#wrapper = this.#inner ?? this.el
	}

	#prevRect?: DOMRect
	#prevWrapperRect?: DOMRect

	willUpdate() {
		const rect = this.el.getBoundingClientRect()
		this.#prevRect = rect
		const wrapperRect = this.#inner?.getBoundingClientRect() ?? rect
		this.#prevWrapperRect = wrapperRect

		this.#children.forEach((comp) => comp.willUpdate(wrapperRect))
	}

	update(parts: KeyedNumberPart[]) {
		const updated = new Map<KeyedNumberPart, Char>()

		// Add new parts before any other updates, so we can save their position correctly:
		const reverse = this.justify === 'right'
		const parent = this.#inner ?? this.el
		const addOp = reverse ? 'prepend' : 'append'
		forEach(parts, reverse, (part) => {
			// Filter out updated children:
			if (this.#children.has(part.key)) return updated.set(part, this.#children.get(part.key)!)

			const comp: Char =
				part.type === 'integer' || part.type === 'fraction'
					? new Digit(this, part.type, 0) // always start at 0 for mathematical correctness
					: new Sym(this, part.type, part.value)
			comp.willUpdate(this.#prevWrapperRect!)
			comp.update(part.value) // then set it to the correct value
			this.#children.set(part.key, comp)

			this.#wrapper[addOp](comp.el)
		})

		// Update any updated children
		updated.forEach((comp, part) => {
			comp.el.classList.remove('section__exiting')
			comp.update(part.value)
		})

		// And mark any removed children
		this.#children.forEach((comp, key) => {
			if (!parts.find((p) => p.key === key)) {
				comp.el.classList.add('section__exiting')
				// Exiting digits should always be set to 0 for mathematical correctness:
				if (comp instanceof Digit) comp.update(0)
			}
		})
	}

	#animation?: Animation
	#maskAnimation?: Animation
	#innerAnimation?: Animation

	didUpdate() {
		if (this.#children.size <= 0) return
		this.#children.forEach((comp) => comp.didUpdate(this.#wrapper.getBoundingClientRect()))

		// Cancel any previous animations before getting the new rects:
		this.#animation?.cancel()
		this.#innerAnimation?.cancel()
		this.#maskAnimation?.cancel()

		const rect = this.el.getBoundingClientRect()
		const scale = this.#prevRect!.width / Math.max(rect.width, 0.01) // avoid divide by zero

		if (scale !== 1) {
			this.#animation = this.el.animate(
				{
					transform: frames(1000, (t) => `scaleX(${lerp(scale, 1, t)})`)
				},
				{
					duration: 1000,
					easing:
						'linear(0, 0.005, 0.02 2.3%, 0.082, 0.16 7.7%, 0.462 16.9%, 0.557, 0.637, 0.707,0.767 30.2%, 0.818, 0.861 37.5%, 0.899 42%, 0.93 46.9%, 0.954 52.4%,0.972 58.7%, 0.984 65.7%, 0.992 74.3%, 0.997 85%, 0.999)'
				}
			)
			// Invert the scale on the inner element:
			this.#innerAnimation = this.#inner?.animate(
				{
					transform: frames(1000, (t) => `scaleX(${1 / lerp(scale, 1, t)})`)
				},
				{
					duration: 1000,
					easing:
						'linear(0, 0.005, 0.02 2.3%, 0.082, 0.16 7.7%, 0.462 16.9%, 0.557, 0.637, 0.707,0.767 30.2%, 0.818, 0.861 37.5%, 0.899 42%, 0.93 46.9%, 0.954 52.4%,0.972 58.7%, 0.984 65.7%, 0.992 74.3%, 0.997 85%, 0.999)'
				}
			)

			if (this.masked)
				this.#maskAnimation = this.el.animate(
					discreteFrames(
						1000,
						(t): DiscreteKeyframeProps => ({
							'--_number-flow-scale-x': lerp(scale, 1, t)
						})
					),
					{
						duration: 1000,
						easing:
							'linear(0, 0.005, 0.02 2.3%, 0.082, 0.16 7.7%, 0.462 16.9%, 0.557, 0.637, 0.707,0.767 30.2%, 0.818, 0.861 37.5%, 0.899 42%, 0.93 46.9%, 0.954 52.4%,0.972 58.7%, 0.984 65.7%, 0.992 74.3%, 0.997 85%, 0.999)'
					}
				)
		}
	}
}

abstract class Char<P extends KeyedNumberPart = KeyedNumberPart> {
	constructor(
		readonly section: Section,
		protected value: P['value'],
		readonly el: HTMLSpanElement
	) {}

	get flow() {
		return this.section.flow
	}

	abstract willUpdate(parentRect: DOMRect): void
	abstract update(value: P['value']): void
	abstract didUpdate(parentRect: DOMRect): void
}

class Digit extends Char<KeyedDigitPart> {
	constructor(
		section: Section,
		private type: KeyedDigitPart['type'],
		value: KeyedDigitPart['value']
	) {
		super(
			section,
			value,
			createElement('span', { className: 'digit', part: `digit ${type}`, textContent: value + '' })
		)
	}

	#prevValue: KeyedDigitPart['value'] | undefined
	#prevRect: DOMRect | undefined

	willUpdate() {
		this.#prevValue = this.value
		// TODO: might be able to optimize this b/c it's relative i.e. if (!this.#prevRect) and set it in didupdate
		this.#prevRect = this.el.getBoundingClientRect()
	}

	update(value: KeyedDigitPart['value']) {
		this.value = value

		if (this.#prevValue !== value) {
			// @ts-expect-error wrong built-in DOM types
			this.el.part = `digit ${this.type} ${value}`

			replaceChildren(this.el, [
				...(value === 0
					? []
					: [
							createElement(
								'span',
								{ className: 'digit__stack digit__lt' },
								Array.from({ length: value }, (_, i) =>
									createElement('span', { className: 'digit__digit', textContent: i + '' })
								)
							)
						]),
				document.createTextNode(value + ''),
				...(value === 9
					? []
					: [
							createElement(
								'span',
								{ className: 'digit__stack digit__gt' },
								Array.from({ length: 9 - value }, (_, i) =>
									createElement('span', {
										className: 'digit__digit',
										textContent: value + i + 1 + ''
									})
								)
							)
						])
			])
		}
	}

	#xAnimation?: Animation
	#yAnimation?: Animation

	didUpdate(parentRect: DOMRect) {
		// Cancel any previous animations before getting the new rect:
		this.#xAnimation?.cancel()
		this.#yAnimation?.cancel()
		const rect = this.el.getBoundingClientRect()

		// Animate y if value updated
		// if (this.#prevValue !== this.value) {
		// 	this.#yAnimation = this.el.animate(
		// 		{
		// 			// Add the offset between the prev top and current parent top to account for interruptions:
		// 			transform: [
		// 				`translateY(calc((100% + ${maskHeight}) * ${this.value - this.#prevValue!} + ${this.#prevRect!.y - parentRect.y}px))`,
		// 				'none'
		// 			]
		// 		},
		// 		{
		// 			duration: 1000,
		// 			easing:
		// 				'linear(0, 0.005, 0.02 2.3%, 0.082, 0.16 7.7%, 0.462 16.9%, 0.557, 0.637, 0.707,0.767 30.2%, 0.818, 0.861 37.5%, 0.899 42%, 0.93 46.9%, 0.954 52.4%,0.972 58.7%, 0.984 65.7%, 0.992 74.3%, 0.997 85%, 0.999)'
		// 		}
		// 	)
		// }
		// this.#xAnimation = this.el.animate(
		// 	{
		// 		transform: [
		// 			`translateX(${this.#prevRect!.x + this.#prevRect!.width / 2 - (rect.x + rect.width / 2)}px)`,
		// 			'none'
		// 		]
		// 	},
		// 	{
		// 		duration: 1000,
		// 		composite: 'accumulate',
		// 		easing:
		// 			'linear(0, 0.005, 0.02 2.3%, 0.082, 0.16 7.7%, 0.462 16.9%, 0.557, 0.637, 0.707,0.767 30.2%, 0.818, 0.861 37.5%, 0.899 42%, 0.93 46.9%, 0.954 52.4%,0.972 58.7%, 0.984 65.7%, 0.992 74.3%, 0.997 85%, 0.999)'
		// 	}
		// )
	}
}

class Sym extends Char<KeyedSymbolPart> {
	constructor(
		section: Section,
		private type: KeyedSymbolPart['type'],
		value: KeyedSymbolPart['value']
	) {
		super(section, value, createElement('span', { part: `symbol ${type}`, textContent: value }))
	}

	willUpdate() {}

	update(value: KeyedSymbolPart['value']) {
		this.el.textContent = value
		this.value = value

		// @ts-expect-error wrong built-in DOM types
		this.el.part = `symbol ${this.type} ${value}`
	}

	didUpdate() {}
}

export default NumberFlow

if (BROWSER && !customElements.get('number-flow')) {
	customElements.define('number-flow', NumberFlow)
}
