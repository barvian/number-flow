import assert from 'node:assert/strict'
import NumberFlow from '@number-flow/react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

assert.equal(typeof document, 'undefined')
assert.equal(typeof HTMLElement, 'undefined')

const html = renderToStaticMarkup(
	createElement(NumberFlow, {
		value: 12345.67,
		locales: 'en-US'
	})
)

assert.match(html, /<template shadowroot=/)
assert.match(html, /<span>12,345\.67<\/span>/)
