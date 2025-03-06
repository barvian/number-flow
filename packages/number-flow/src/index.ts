import NumberFlowLite from './lite'
import { define } from './util/dom'
import { renderInnerHTML as defaultRenderInnerHTML } from './ssr'
import { formatToData, type Value, type Format } from './formatter'

export * from './lite'

export const CONNECT_EVENT = 'number-flow-connect'
export const UPDATE_EVENT = 'number-flow-update'

// Override the export from ./lite
export const renderInnerHTML = (
	value: Value,
	{
		locales,
		format,
		numberPrefix: prefix,
		numberSuffix: suffix
	}: {
		locales?: Intl.LocalesArgument
		format?: Intl.NumberFormatOptions
		numberPrefix?: string
		numberSuffix?: string
	} = {}
) => {
	const data = formatToData(value, new Intl.NumberFormat(locales, format), prefix, suffix)

	return defaultRenderInnerHTML(data)
}

export default class NumberFlow extends NumberFlowLite {
	/**
	 * @internal for grouping
	 */
	connected = false
	connectedCallback() {
		this.connected = true
		this.dispatchEvent(new Event(CONNECT_EVENT, { bubbles: true }))
	}
	disconnectedCallback() {
		this.connected = false
	}

	format?: Format
	locales?: Intl.LocalesArgument
	// This can't be called prefix because that conflicts:
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/prefix
	numberPrefix?: string
	numberSuffix?: string

	private _formatter?: Intl.NumberFormat

	private _prevFormat?: Format
	private _prevLocales?: Intl.LocalesArgument

	private _value?: Value
	get value() {
		return this._value
	}

	update(value?: Value) {
		// Might want to do a deep-equal check here:
		if (
			!this._formatter ||
			this._prevFormat !== this.format ||
			this._prevLocales !== this.locales
		) {
			this._formatter = new Intl.NumberFormat(this.locales, this.format)
			this._prevFormat = this.format
			this._prevLocales = this.locales
		}
		if (value != null) {
			this._value = value
		}

		// For group, has to be before setting data:
		this.dispatchEvent(new Event(UPDATE_EVENT, { bubbles: true }))

		this.data = formatToData(this._value!, this._formatter!, this.numberPrefix, this.numberSuffix)
	}
}

define('number-flow', NumberFlow)

declare global {
	interface HTMLElementTagNameMap {
		'number-flow': NumberFlow
	}
}
