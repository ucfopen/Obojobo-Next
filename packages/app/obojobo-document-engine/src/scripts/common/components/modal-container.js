import './modal-container.scss'

import React from 'react'

// <div className="content">{props.children}</div>
// <div className="content">{React.cloneElement(props.children, { assessmentId: props.assessmentId })}</div>
const ModalContainer = props => (
	<div className="obojobo-draft--components--modal-container">
		<div className="content">
			{React.cloneElement(props.children, { assessmentId: props.assessmentId })}
		</div>
	</div>
)

export default ModalContainer
