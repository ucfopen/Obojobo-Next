import '../../viewer-component.scss'

import React from 'react'

const Line = props => {
	return (
		<span
			className={'text align-' + props.element.content.align}
			data-indent={props.element.content.indent}
			data-hanging-indent={props.element.content.hangingIndent}
		>
			{props.children}
		</span>
	)
}

export default Line
