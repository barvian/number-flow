import { BROWSER } from 'esm-env'
import { css } from './util/css'

export const supportsLinear =
	BROWSER &&
	typeof CSS !== 'undefined' &&
	CSS.supports('transition-timing-function', 'linear(1, 2)')

export const supportsAtProperty =
	BROWSER && typeof CSS !== 'undefined' && typeof CSS.registerProperty !== 'undefined'

export const supportsAnimationComposition =
	BROWSER &&
	typeof CSS !== 'undefined' &&
	typeof CSS.supports('animation-composition', 'accumulate') !== 'undefined'

if (supportsAtProperty) {
	try {
		CSS.registerProperty({
			name: '--_number-flow-scale-x',
			syntax: '<number>',
			inherits: false,
			initialValue: '1'
		})
	} catch {
		// Ignore if already registered
	}
}

// Mask technique taken from:
// https://expensive.toys/blog/blur-vignette

export const charHeight = 'var(--number-flow-char-height, 1em)'

export const maskHeight = 'var(--number-flow-mask-height, 0.25em)'
const maskWidth = 'var(--number-flow-mask-width, 0.5em)'

const scaledMaskWidth = `${maskWidth} * 1/var(--_number-flow-scale-x)`
const calcScaledMaskWidth = `calc(${scaledMaskWidth})`

const verticalMask = `linear-gradient(to bottom, transparent 0, #000 ${maskHeight}, #000 calc(100% - ${maskHeight}), transparent 100%)`
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
		display: inline-block;
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

	.section {
		display: inline-block;
		padding-bottom: ${halfMaskHeight};
		padding-top: ${halfMaskHeight};
		vertical-align: top; /* Safari needs this for some reason */
		user-select: none;
		/* Prevent height from collapsing when empty */
		height: calc(${maskHeight} + ${charHeight});
	}

	.section:not(.section--masked),
	.section--masked .section__inner {
		/* for .section__exiting: */
		position: relative;
		isolation: isolate;
	}

	.section__inner {
		display: inline-block;
		transform-origin: inherit;
		height: inherit;
	}

	.section--justify-left {
		transform-origin: center left;
	}

	.section--justify-right {
		transform-origin: center right;
	}

	.section--masked {
		overflow: clip;
		position: relative; /* for z-index */
		z-index: -1; /* display underneath other sections */
		--_number-flow-scale-x: 1;
		/* -webkit prefixed versions have universally better support than non-prefixed */
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-size:
			calc(100% - ${scaledMaskWidth}) 100%,
			100% calc(100% - ${maskHeight} * 2),
			${calcScaledMaskWidth} ${maskHeight},
			${calcScaledMaskWidth} ${maskHeight};
	}

	.section--masked.section--justify-left {
		padding-right: ${maskWidth};
		margin-right: calc(-1 * ${maskWidth});
		-webkit-mask-image:
			${verticalMask},
			linear-gradient(to right, #000 0, #000 calc(100% - ${scaledMaskWidth}), transparent 100%),
			/* TR corner */ radial-gradient(at bottom left, ${cornerGradient}),
			/* BR corner */ radial-gradient(at top left, ${cornerGradient});
		-webkit-mask-position:
			left,
			center,
			right top,
			right bottom;
	}

	.section--masked.section--justify-right {
		padding-left: ${maskWidth};
		margin-left: calc(-1 * ${maskWidth});
		-webkit-mask-image:
			${verticalMask},
			linear-gradient(to left, #000 0, #000 calc(100% - ${scaledMaskWidth}), transparent 100%),
			/* TL corner */ radial-gradient(at bottom right, ${cornerGradient}),
			/* BL corner */ radial-gradient(at top right, ${cornerGradient});
		-webkit-mask-position:
			right,
			center,
			left top,
			left bottom;
	}

	.section__exiting {
		position: absolute !important;
		z-index: -1;
		/* top: 0; this seemed to backfire */
	}

	.digit {
		display: inline-block;
	}

	.digit__roll {
		display: inline-block;
		position: relative;
		transform-style: preserve-3d;
		backface-visibility: hidden;
		transform-origin: center center calc((${charHeight} + ${maskHeight}) / 0.649838);
	}

	.digit__num {
		display: inline-block;
		padding: ${halfMaskHeight} 0;
		backface-visibility: hidden;
	}

	.digit__num:not(.current) {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%) rotateX(calc((var(--c) - var(--i)) * -36deg));
		transform-origin: center center calc((${charHeight} + ${maskHeight}) / 0.649838);
	}

	.symbol {
		display: inline-block;
		position: relative;
		isolation: isolate;
		padding: ${halfMaskHeight} 0;
	}

	.symbol__value {
		display: inline-block;
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
`

export default styles
