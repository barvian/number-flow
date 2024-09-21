import { BROWSER } from 'esm-env'

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

export const maskHeight = 'var(--mask-height, 0.15em)'
const maskWidth = 'var(--mask-width, 0.5em)'

const scaledMaskWidth = `${maskWidth} * 1/var(--_number-flow-scale-x)`
const calcScaledMaskWidth = `calc(${scaledMaskWidth})`

const verticalMask = `linear-gradient(to bottom, transparent 0, #000 ${maskHeight}, #000 calc(100% - ${maskHeight}), transparent 100%)`
const cornerGradient = `#000 0, transparent 71%` // or transparent ${maskWidth}

const styles = `
:host {
	display: inline-flex;
	direction: ltr;
	position: relative;
	isolation: isolate;
	user-select: none;
	pointer-events: none;
	white-space: nowrap;

	--fade-duration: 0.5s;
	--fade-easing: ease-out;
}

.label {
	position: absolute;
	left: 0;
	top: ${maskHeight};
	font-kerning: none;
	color: transparent !important;
	z-index: -1;
	user-select: text;
	pointer-events: auto;
}

.section {
	display: inline-block; /* inline-flex broke with absolute positioned children in Safari */
	user-select: none;
}

.section__inner {
	display: inline-block;
	justify-content: inherit;
	transform-origin: inherit;
	/* for .section__exiting: */
	position: relative; 
	isolation: isolate;
}

.section--justify-left {
	justify-content: left;
	transform-origin: center left;
}

.section--justify-right {
	justify-content: right;
	transform-origin: center right;
}

.section--masked {
	overflow: clip;
	padding-bottom: ${maskHeight};
	padding-top: ${maskHeight};
	position: relative; /* for z-index */
	z-index: -1; /* display underneath other sections */
	--_number-flow-scale-x: 1;
	/* -webkit prefixed versions have universally better support than non-prefixed */
	-webkit-mask-repeat: no-repeat;
	-webkit-mask-size:
		calc(100% - ${scaledMaskWidth}) 100%, 100% calc(100% - ${maskHeight} * 2), ${calcScaledMaskWidth} ${maskHeight}, ${calcScaledMaskWidth} ${maskHeight};
}

	.section--masked.section--justify-left {
		padding-right: ${maskWidth};
		margin-right: calc(-1 * ${maskWidth});
		-webkit-mask-image:
			${verticalMask},
			linear-gradient(to right, #000 0, #000 calc(100% - ${scaledMaskWidth}), transparent 100%), 
			/* TR corner */
			radial-gradient(at bottom left, ${cornerGradient}),
			/* BR corner */
			radial-gradient(at top left, ${cornerGradient})
		;
		-webkit-mask-position: left, center, right top, right bottom;
	}

	.section--masked.section--justify-right {
		padding-left: ${maskWidth};
		margin-left: calc(-1 * ${maskWidth});
		-webkit-mask-image:
			${verticalMask},
			linear-gradient(to left, #000 0, #000 calc(100% - ${scaledMaskWidth}), transparent 100%),
			/* TL corner */
			radial-gradient(at bottom right, ${cornerGradient}),
			/* BL corner */
			radial-gradient(at top right, ${cornerGradient})
		;
		-webkit-mask-position: right, center, left top, left bottom;
	}

.section__exiting {
	position: absolute !important;
	z-index: -1;
	top: 0;
}

.section__char {
	opacity: 0;
	transition: var(--fade-duration) opacity var(--fade-easing);
}

	.section__char.is-active {
		opacity: 1;
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
`

export default styles
