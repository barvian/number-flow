import { BROWSER } from 'esm-env'
import { css } from './util/css'

export const supportsLinear =
	BROWSER &&
	typeof CSS !== 'undefined' &&
	CSS.supports('transition-timing-function', 'linear(1, 2)')

export const supportsAnimationComposition =
	BROWSER &&
	typeof CSS !== 'undefined' &&
	typeof CSS.supports('animation-composition', 'accumulate') !== 'undefined'

// Register vars needed for animation but not during SSR:
export const opacityDeltaVar = '--_number-flow-d-opacity'
export const widthDeltaVar = '--_number-flow-d-width'
export const widthVar = '--_number-flow-width'
export const scaleXVar = '--_number-flow-scale-x'
export const dxVar = '--_number-flow-dx'

export const supportsAtProperty = (() => {
	try {
		CSS.registerProperty({
			name: opacityDeltaVar,
			syntax: '<number>',
			inherits: false,
			initialValue: '0'
		})

		CSS.registerProperty({
			name: dxVar,
			syntax: '<length>',
			inherits: true,
			initialValue: '0px'
		})

		CSS.registerProperty({
			name: widthDeltaVar,
			syntax: '<number>',
			inherits: false,
			initialValue: '0'
		})

		CSS.registerProperty({
			name: widthVar,
			syntax: '<number>',
			inherits: false,
			initialValue: '1'
		})

		CSS.registerProperty({
			name: scaleXVar,
			syntax: '<number>',
			inherits: true,
			initialValue: '1'
		})
		return true
	} catch {
		return false
	}
})()

// Don't use CSS.registerProperty for vars needed during SSR:
export const charHeight = 'var(--number-flow-char-height, 1em)'

// Mask technique taken from:
// https://expensive.toys/blog/blur-vignette
export const maskHeight = 'var(--number-flow-mask-height, 0.25em)'
const halfMaskHeight = `calc(${maskHeight} / 2)`
const maskWidth = 'var(--number-flow-mask-width, 0.5em)'
const scaledMaskWidth = `calc(${maskWidth} / var(${scaleXVar}))`

const cornerGradient = `#000 0, transparent 71%` // or transparent ${maskWidth}

export const SlottedTag = 'span'
export const slottedStyles = ({ willChange }: { willChange?: boolean }) =>
	({
		fontKerning: 'none',
		display: 'inline-block',
		lineHeight: charHeight,
		padding: `${maskHeight} 0`,
		willChange: willChange ? 'transform' : undefined
	}) as const

const styles = css`
	:host {
		display: inline-flex; /* better for matching baselines with other inline elements */
		direction: ltr;
		white-space: nowrap;
		/* for invisible slotted label used for screen readers and selecting: */
		position: relative;
		line-height: ${charHeight} !important;
		isolation: isolate;
	}

	::slotted(${SlottedTag}) {
		position: absolute;
		left: 0;
		top: 0;
		color: transparent !important;
		z-index: -1;
	}

	:host > .number,
	:host > .section {
		pointer-events: none;
		user-select: none;
	}

	.number,
	.number__inner {
		display: inline-flex;
		transform-origin: left top;
	}

	:host([data-will-change]) .number,
	:host([data-will-change]) .number__inner {
		will-change: transform;
	}

	.number {
		${scaleXVar}: calc(1 + var(${widthDeltaVar}) / var(${widthVar}));
		transform: translateX(var(${dxVar})) scaleX(var(${scaleXVar}));

		margin: 0 calc(-1 * ${maskWidth});
		position: relative; /* for z-index */
		z-index: -1; /* display underneath other sections */

		overflow: clip; /* important so it doesn't affect page layout */
		/* -webkit- prefixed properties have better support than unprefixed ones: */
		-webkit-mask-image: 
			/* Horizontal: */
			linear-gradient(
				to right,
				transparent 0,
				#000 ${scaledMaskWidth},
				#000 calc(100% - ${scaledMaskWidth}),
				transparent
			),
			/* Vertical: */
				linear-gradient(
					to bottom,
					transparent 0,
					#000 ${maskHeight},
					#000 calc(100% - ${maskHeight}),
					transparent 100%
				),
			/* TL corner */ radial-gradient(at bottom right, ${cornerGradient}),
			/* TR corner */ radial-gradient(at bottom left, ${cornerGradient}),
			/* BR corner */ radial-gradient(at top left, ${cornerGradient}),
			/* BL corner */ radial-gradient(at top right, ${cornerGradient});
		-webkit-mask-size:
			100% calc(100% - ${maskHeight} * 2),
			calc(100% - ${scaledMaskWidth} * 2) 100%,
			${scaledMaskWidth} ${maskHeight},
			${scaledMaskWidth} ${maskHeight},
			${scaledMaskWidth} ${maskHeight},
			${scaledMaskWidth} ${maskHeight};
		-webkit-mask-position:
			center,
			center,
			top left,
			top right,
			bottom right,
			bottom left;
		-webkit-mask-repeat: no-repeat;
	}

	.number__inner {
		padding: 0 ${maskWidth};
		/* invert parent's: */
		transform: scaleX(calc(1 / var(${scaleXVar}))) translateX(calc(-1 * var(${dxVar})));
	}

	.section {
		display: inline-flex;
		padding-bottom: ${halfMaskHeight};
		padding-top: ${halfMaskHeight};
		height: calc(${charHeight} + ${halfMaskHeight} * 2);
		/* for .section__exiting: */
		position: relative;
		isolation: isolate;
	}

	:host([data-will-change]) .section {
		will-change: transform;
	}

	.section--justify-left {
		transform-origin: center left;
	}

	.section--justify-right {
		transform-origin: center right;
	}

	.section__exiting {
		position: absolute !important;
		z-index: -1;
		/* top: 0; this seemed to backfire */
	}

	.digit {
		display: block;
	}

	:host([data-will-change]) .digit {
		will-change: transform;
	}

	.digit__roll {
		display: block;
		position: relative;
	}

	:host([data-will-change]) .digit_roll {
		will-change: transform, transform-style;
	}

	.digit__roll.is-spinning {
		transform-style: preserve-3d;
		backface-visibility: hidden;
		transform-origin: center center calc((${charHeight} + ${maskHeight}) / 0.649838);
	}

	.digit__roll.is-spinning .digit__num {
		backface-visibility: hidden;
	}

	.digit__num {
		display: block;
		padding: ${halfMaskHeight} 0;
	}

	.digit__num:not(.is-current) {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%) rotateX(calc((var(--c) - var(--i)) * -36deg));
		transform-origin: center center calc((${charHeight} + ${maskHeight}) / 0.649838);
	}

	.digit__roll:not(.is-spinning) .digit__num:not(.is-current) {
		display: none;
	}

	.symbol {
		display: inline-flex;
		position: relative;
		isolation: isolate;
		padding: ${halfMaskHeight} 0;
	}

	:host([data-will-change]) .symbol {
		will-change: transform;
	}

	.symbol__value {
		display: block;
		white-space: pre; /* some symbols are spaces or thin spaces */
	}

	.symbol__exiting {
		position: absolute;
		z-index: -1;
	}

	.section--justify-left .symbol__exiting {
		left: 0;
	}

	.section--justify-right .symbol__exiting {
		right: 0;
	}

	.animate-presence {
		opacity: calc(1 + var(${opacityDeltaVar}));
	}
`

export default styles
