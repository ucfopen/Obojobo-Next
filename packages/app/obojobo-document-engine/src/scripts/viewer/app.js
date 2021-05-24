import Common from 'obojobo-document-engine/src/scripts/common'
import Viewer from 'obojobo-document-engine/src/scripts/viewer'
import FeatureFlags from 'obojobo-document-engine/src/scripts/common/util/feature-flags'
import React from 'react'
import ReactDOM from 'react-dom'
import './polyfills'
const { Dispatcher } = Common.flux

// get the visit and draft from the url
const urlTokens = document.location.pathname.split('/')
const visitId = urlTokens[4] ? urlTokens[4] : null
const draftId = urlTokens[2] ? urlTokens[2] : null

// Set up listeners for window for blur/focus
const onFocus = function() {
	document.body.className = 'is-focused-window'
	return Dispatcher.trigger('window:focus')
}

const onBlur = function() {
	document.body.className = 'is-blured-window'
	return Dispatcher.trigger('window:blur')
}

window.onfocus = onFocus
window.onblur = onBlur

// Expose an obojobo object:
window.obojobo = {
	flags: FeatureFlags
}

window.__oboViewerRender = () => {
	ReactDOM.render(
		<div className="root">
			<Viewer.components.ViewerApp visitId={visitId} draftId={draftId} />
		</div>,
		document.getElementById('viewer-app')
	)
}
