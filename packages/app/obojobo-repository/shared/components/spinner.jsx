require('./spinner.scss')

const React = require('react')

function Spinner({ color = 'black' }) {
	return (
		<div className="obojobo-draft--components--spinner" aria-label="Loading content">
			<div className="spinner" aria-hidden={true}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 100 100"
					preserveAspectRatio="xMidYMid"
				>
					<circle
						cx="50"
						cy="50"
						fill="none"
						stroke={color}
						strokeWidth="10"
						r="35"
						strokeDasharray="60 110"
						transform="rotate(0.82332 50 50)"
					></circle>
				</svg>
			</div>
		</div>
	)
}

module.exports = Spinner
