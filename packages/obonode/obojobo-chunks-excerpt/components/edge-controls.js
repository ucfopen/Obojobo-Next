import React from 'react'

const EdgeControls = ({ position, edges, selectedEdge, onChangeEdge }) => {
	if (edges.length === 0) {
		return null
	}

	const onMouseDown = (edgeType, event) => {
		event.preventDefault()

		onChangeEdge(edgeType)
	}

	const onChange = event => {
		event.preventDefault()

		onChangeEdge(event.target.value)
	}

	return (
		<div
			className={`obojobo-draft--chunks--excerpt--edge-controls is-position-${position}`}
			contentEditable={false}
			role="radiogroup"
			aria-label={`Select the edge display for the ${position} edge`}
		>
			<div className="edges">
				{edges.map(e => (
					<label
						key={e}
						className={(selectedEdge === e ? 'is-selected' : 'is-not-selected') + ' is-edge-' + e}
						onMouseDown={onMouseDown.bind(null, e)}
					>
						<input
							type="radio"
							name={position}
							value={e}
							checked={selectedEdge === e}
							onChange={onChange}
						/>
						<span>{e}</span>
					</label>
				))}
			</div>
		</div>
	)
}

export default EdgeControls
