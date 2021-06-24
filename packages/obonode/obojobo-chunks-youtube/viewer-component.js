import './viewer-component.scss'

import React from 'react'
import Viewer from 'obojobo-document-engine/src/scripts/viewer'
import YouTubePlayer from './youtube-player'

const { OboComponent } = Viewer.components

const YouTube = props => (
	<OboComponent
		model={props.model}
		moduleData={props.moduleData}
		aria-label="YouTube Video"
		role="region"
	>
		<div className="obojobo-draft--chunks--you-tube viewer">
			<YouTubePlayer content={props.model.modelState} nodeId={props.model.id} />
		</div>
	</OboComponent>
)

export default YouTube
