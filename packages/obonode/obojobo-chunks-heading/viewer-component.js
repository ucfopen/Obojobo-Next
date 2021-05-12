import './viewer-component.scss'

import Common from 'obojobo-document-engine/src/scripts/common'
import React from 'react'
import Viewer from 'obojobo-document-engine/src/scripts/viewer'

const { OboComponent } = Viewer.components
const { TextGroupEl } = Common.chunk.textChunk
const { TextChunk } = Common.chunk

const Heading = props => {
	// creates an h1, h2, h3, etc to use in jsx below
	const HTag = `h${props.model.modelState.headingLevel}`

	return (
		<OboComponent model={props.model} moduleData={props.moduleData}>
			<TextChunk className="obojobo-draft--chunks--heading pad">
				<HTag>
					<p>{'Dog=' + props.model.modelState.dog}</p>
					<TextGroupEl
						parentModel={props.model}
						textItem={props.model.modelState.textGroup.first}
						groupIndex="0"
					/>
				</HTag>
			</TextChunk>
		</OboComponent>
	)
}

export default Heading
