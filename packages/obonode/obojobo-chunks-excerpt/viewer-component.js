import './viewer-component.scss'

import Common from 'obojobo-document-engine/src/scripts/common'
import React from 'react'
import Viewer from 'obojobo-document-engine/src/scripts/viewer'

const { OboComponent } = Viewer.components
const { TextGroupEl } = Common.chunk.textChunk
const { TextChunk } = Common.chunk

const Excerpt = props => {
	const modelState = props.model.modelState

	return (
		<OboComponent model={props.model} moduleData={props.moduleData}>
			<TextChunk
				className={`obojobo-draft--chunks--excerpt pad is-body-style-type-${
					modelState.bodyStyle
				} is-top-edge-type-${modelState.topEdge} is-bottom-edge-type-${
					modelState.bottomEdge
				} is-width-${modelState.width} is-font-${modelState.font} is-font-style-${
					modelState.fontStyle
				} is-line-height-type-${modelState.lineHeight} is-font-size-${modelState.fontSize} ${
					modelState.effect ? 'is-showing-effect' : 'is-not-showing-effect'
				}`}
			>
				<blockquote cite="test">
					<div className="excerpt-content">
						<div className="wrapper">
							{props.model.children.models.map((child, index) => {
								const Component = child.getComponentClass()

								return <Component key={index} model={child} moduleData={props.moduleData} />
							})}
						</div>
						<div className="overlay" />
					</div>

					{!modelState.citation.isBlank ? (
						<cite>
							{modelState.citation.items.map((textItem, index) => (
								<TextGroupEl
									parentModel={props.model}
									textItem={textItem}
									groupIndex={index}
									key={index}
								/>
							))}
						</cite>
					) : null}
				</blockquote>
			</TextChunk>
		</OboComponent>
	)
}

export default Excerpt
