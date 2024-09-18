// Mask technique taken from:
// https://expensive.toys/blog/blur-vignette

export const maskHeight = 'var(--mask-height, 0.15em)'
const maskWidth = 'var(--mask-width, 0.5em)'

const verticalMask = `linear-gradient(to bottom, transparent 0, #000 ${maskHeight}, #000 calc(100% - ${maskHeight}), transparent 100%)`
const cornerGradient = `#000 0, transparent 71%` // or transparent ${maskWidth}

export const maskSize = (scaleX = 1) => {
	let scaledMaskWidth: string, calcScaledMaskWidth: string
	if (scaleX === 1) {
		scaledMaskWidth = calcScaledMaskWidth = maskWidth
	} else {
		scaledMaskWidth = `${scaleX}*${maskWidth}`
		calcScaledMaskWidth = `calc(${scaledMaskWidth})`
	}
	return `calc(100% - ${scaledMaskWidth}) 100%, ${calcScaledMaskWidth} calc(100% - ${maskHeight} * 2), ${calcScaledMaskWidth} ${maskHeight}, ${calcScaledMaskWidth} ${maskHeight}`
	//      ^ vertical                                ^ horizontal                                       ^ corners
}

const styles = `
:host {
	display: inline-flex;
	direction: ltr;
	position: relative;
	isolation: isolate;
	user-select: none;
	pointer-events: none;
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
	display: inline-flex;
	user-select: none;
}

.section__inner {
	display: inline-flex;
	justify-content: inherit;
	/* for .section__exiting: */
	position: relative; 
	isolation: isolate;
}

.section--justify-left {
	justify-content: left;
	transform-origin: center left;
}

	.section--justify-left .section__inner {
		transform-origin: center left;
	}

.section--justify-right {
	justify-content: right;
	transform-origin: center right;
}

	.section--justify-right .section__inner {
		transform-origin: center right;
	}

.section--masked {
	overflow: clip;
	padding-bottom: ${maskHeight};
	padding-top: ${maskHeight};
	position: relative; /* for z-index */
	z-index: -1; /* display underneath other sections */
	/* -webkit prefixed versions have universally better support than non-prefixed */
	-webkit-mask-repeat: no-repeat;
	-webkit-mask-size: ${maskSize()};
}

	.section--masked.section--justify-left {
		padding-right: ${maskWidth};
		margin-right: calc(-1 * ${maskWidth});
		-webkit-mask-image:
			${verticalMask},
			linear-gradient(to right, #000, transparent),
			/* TR corner */
			radial-gradient(at bottom left, ${cornerGradient}),
			/* BR corner */
			radial-gradient(at top left, ${cornerGradient})
		;
		-webkit-mask-position: left, right center, right top, right bottom;
	}

	.section--masked.section--justify-right {
		padding-left: ${maskWidth};
		margin-left: calc(-1 * ${maskWidth});
		-webkit-mask-image:
			${verticalMask},
			linear-gradient(to right, transparent, #000),
			/* TL corner */
			radial-gradient(at bottom right, ${cornerGradient}),
			/* BL corner */
			radial-gradient(at top right, ${cornerGradient})
		;
		-webkit-mask-position: right, left center, left top, left bottom;
	}

.section__exiting {
	position: absolute !important;
	z-index: -1;
	top: 0;
	opacity: 0;
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
