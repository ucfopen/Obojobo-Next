import './viewer-component.scss'

import Common from 'obojobo-document-engine/src/scripts/common'
import Image from './image'
import React from 'react'
import Viewer from 'obojobo-document-engine/src/scripts/viewer'
import ImageCaptionWidthTypes from './image-caption-width-types'

const { NonEditableChunk } = Common.chunk
const { TextGroupEl } = Common.chunk.textChunk
const { OboComponent } = Viewer.components

const Figure = props => {
	const content = props.model.modelState
	const customStyle = {}
	const captionStyle = {}
	if (content.size === 'custom') {
		if (content.width) {
			customStyle.width = content.width + 'px'

			if (content.captionWidth === ImageCaptionWidthTypes.IMAGE_WIDTH) {
				captionStyle.width = content.width + 'px'
			}
		}

		if (content.height) {
			customStyle.height = content.height + 'px'
		}

		customStyle['maxWidth'] = '100%'
	}

	return (
		<OboComponent
			model={props.model}
			moduleData={props.moduleData}
			className={`is-align-${props.model.modelState.align}`}
		>
			<NonEditableChunk
				className={`obojobo-draft--chunks--figure viewer ${props.model.modelState.size}`}
			>
				<div className="container">
					<figure unselectable="on">
						<Image chunk={props.model} style={customStyle} />
						{props.model.modelState.textGroup.first.text.length > 0 ? (
							<figcaption
								className={`is-caption-width-${content.captionWidth}`}
								style={captionStyle}
							>
								<TextGroupEl
									parentModel={props.model}
									textItem={props.model.modelState.textGroup.first}
									groupIndex="0"
								/>
							</figcaption>
						) : null}
					</figure>
				</div>
			</NonEditableChunk>
		</OboComponent>
	)
}

export default Figure
