import Common from 'obojobo-document-engine/src/scripts/common'
import Editor from './index'
import FeatureFlags from 'obojobo-document-engine/src/scripts/common/util/feature-flags'
import React from 'react'
import ReactDOM from 'react-dom'

// set up global event listeners
const { Dispatcher } = Common.flux

// Set up listeners for window for blur/focus
const onFocus = function() {
	document.body.className = 'is-focused-window'
	return Dispatcher.trigger('window:focus')
}

const onBlur = function() {
	document.body.className = 'is-blured-window'
	return Dispatcher.trigger('window:blur')
}

const ie = false
//@cc_on ie = true;
if (ie) {
	document.onfocusin = onFocus
	document.onfocusout = onBlur
} else {
	window.onfocus = onFocus
	window.onblur = onBlur
}

// Expose an obojobo object:
window.obojobo = {
	flags: FeatureFlags
}

window.__oboEditorRender = (settings = {}) => {
	ReactDOM.render(
		<div className="root">
			<Editor.components.EditorApp settings={settings} />
		</div>,
		document.getElementById('editor-app')
	)
}
