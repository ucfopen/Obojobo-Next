import Common from 'obojobo-document-engine/src/scripts/common'
import ViewerComponent from './viewer-component'
import adapter from './adapter'

Common.Registry.registerModel('ObojoboDraft.Chunks.Excerpt', {
	adapter,
	componentClass: ViewerComponent,
	default: true,
	type: 'chunk'
})
