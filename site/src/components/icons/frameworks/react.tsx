export default function React(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23 23 20.46">
			<title> React Logo </title>
			<circle r="2.05" fill="#61dafb" />
			<g fill="none" stroke="#61dafb">
				<ellipse rx="11" ry="4.2" />
				<ellipse rx="11" ry="4.2" transform="rotate(60)" />
				<ellipse rx="11" ry="4.2" transform="rotate(120)" />
			</g>
		</svg>
	)
}
