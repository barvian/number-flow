import { BROWSER } from 'esm-env'
import { css } from './util/css'

export const supportsLinear =
	BROWSER &&
	typeof CSS !== 'undefined' &&
	CSS.supports('transition-timing-function', 'linear(1, 2)')

export const opacityDeltaVar = '--_number-flow-d-opacity'
export const widthDeltaVar = '--_number-flow-d-width'
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
			syntax: '<number>',
			inherits: true,
			initialValue: '0'
		})

		CSS.registerProperty({
			name: widthDeltaVar,
			syntax: '<number>',
			inherits: true,
			initialValue: '0'
		})
		return true
	} catch {
		return false
	}
})()

export const supportsAnimationComposition =
	BROWSER &&
	typeof CSS !== 'undefined' &&
	typeof CSS.supports('animation-composition', 'accumulate') !== 'undefined'

// Mask technique taken from:
// https://expensive.toys/blog/blur-vignette

export const charHeight = 'var(--number-flow-char-height, 1em)'

export const maskHeight = 'var(--number-flow-mask-height, 0.25em)'
const maskWidth = 'var(--number-flow-mask-width, 0.5em)'

const scaledMaskWidth = `calc(${maskWidth} / var(--scale))`

const cornerGradient = `#000 0, transparent 71%` // or transparent ${maskWidth}

export const SlottedTag = 'span'
export const slottedStyles = {
	fontKerning: 'none',
	display: 'inline-block',
	lineHeight: charHeight,
	padding: `${maskHeight} 0`
} as const

const halfMaskHeight = `calc(${maskHeight} / 2)`

const styles = css`
	:host {
		display: inline-flex; /* better for matching baselines with other inline elements */
		direction: ltr;
		user-select: none;
		pointer-events: none;
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
		user-select: text;
		pointer-events: auto;
	}

	.number,
	.number__inner {
		align-items: baseline;
		display: inline-flex;
		transform-origin: left top;
	}

	.number {
		--scale: calc(1 + var(${widthDeltaVar}) / var(--width));
		transform: translateX(calc(1px * var(${dxVar}))) scaleX(var(--scale));

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
		transform: scaleX(calc(1 / var(--scale))) translateX(calc(-1px * var(${dxVar})));
	}

	.section {
		align-items: baseline;
		display: inline-flex;
		padding-bottom: ${halfMaskHeight};
		padding-top: ${halfMaskHeight};
		user-select: none;
		/* for .section__exiting: */
		position: relative;
		isolation: isolate;
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

	.digit__roll {
		display: block;
		position: relative;
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

	.empty {
		display: block;
		padding: ${halfMaskHeight} 0;
	}

	.symbol {
		align-items: baseline;
		display: inline-flex;
		position: relative;
		isolation: isolate;
		padding: ${halfMaskHeight} 0;
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
