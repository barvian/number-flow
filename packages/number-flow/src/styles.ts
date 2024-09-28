import { BROWSER } from 'esm-env'
import { css } from './util/css'

export const SUPPORTS_LINEAR =
	BROWSER &&
	typeof CSS !== 'undefined' &&
	CSS.supports('transition-timing-function', 'linear(1, 2)')

export const SUPPORTS_PROPERTY =
	BROWSER && typeof CSS !== 'undefined' && typeof CSS.registerProperty !== 'undefined'

export const SUPPORTS_ANIMATION_COMPOSITION =
	BROWSER &&
	typeof CSS !== 'undefined' &&
	typeof CSS.supports('animation-composition', 'accumulate') !== 'undefined'

if (SUPPORTS_PROPERTY) {
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

export const maskHeight = 'var(--number-flow-mask-height, 0.15em)'
const maskWidth = 'var(--number-flow-mask-width, 0.5em)'

const scaledMaskWidth = `${maskWidth} * 1/var(--_number-flow-scale-x)`
const calcScaledMaskWidth = `calc(${scaledMaskWidth})`

const verticalMask = `linear-gradient(to bottom, transparent 0, #000 ${maskHeight}, #000 calc(100% - ${maskHeight}), transparent 100%)`
const cornerGradient = `#000 0, transparent 71%` // or transparent ${maskWidth}

export const SLOTTED_TAG = 'span'
export const SLOTTED_STYLES = {
	fontKerning: 'none',
	display: 'inline-block',
	lineHeight: charHeight,
	padding: `${maskHeight} 0`
} as const

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

	::slotted(${SLOTTED_TAG}) {
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
		padding-bottom: ${maskHeight};
		padding-top: ${maskHeight};
		vertical-align: top; /* Safari needs this for some reason */
		user-select: none;
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
		position: relative;
	}

	.digit__stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: ${maskHeight};
		position: absolute;
		width: 100%;
	}

	.digit__stack > * {
		display: inline-block;
	}

	.digit__lt {
		bottom: calc(100% + ${maskHeight});
	}

	.digit__gt {
		top: calc(100% + ${maskHeight});
	}

	.symbol {
		display: inline-block;
		position: relative;
		isolation: isolate;
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
