import Common from 'Common'
import { DEFAULT_ZOOM } from '../stores/media-store/media-constants'

const { Dispatcher } = Common.flux

const MediaUtil = {
	mediaPlayed(actor, playheadPosition, url, nodeId) {
		// console.log(nodeId)
		return Dispatcher.trigger('media:play', {
			value: {
				actor,
				playheadPosition,
				url,
				nodeId
			}
		})
	},

	mediaPaused(actor, playheadPosition, url, nodeId) {
		return Dispatcher.trigger('media:pause', {
			value: {
				actor,
				playheadPosition,
				url,
				nodeId
			}
		})
	},

	mediaEnded(actor, playheadPosition, url, nodeId) {
		return Dispatcher.trigger('media:end', {
			value: {
				actor,
				playheadPosition,
				url,
				nodeId
			}
		})
	},

	mediaSeekTo(actor, playheadPosition, previousPlayheadPosition, url, nodeId) {
		return Dispatcher.trigger('media:seekTo', {
			value: {
				actor,
				playheadPosition,
				previousPlayheadPosition,
				url,
				nodeId
			}
		})
	},

	mediaBuffering(actor, playheadPosition, url, nodeId) {
		return Dispatcher.trigger('media:buffer', {
			value: {
				actor,
				playheadPosition,
				url,
				nodeId
			}
		})
	},

	mediaUnloaded(actor, playheadPosition, url, nodeId) {
		return Dispatcher.trigger('media:unload', {
			value: {
				actor,
				playheadPosition,
				url,
				nodeId
			}
		})
	},

	show(id) {
		return Dispatcher.trigger('media:show', {
			value: {
				id
			}
		})
	},

	hide(id, actor = null) {
		return Dispatcher.trigger('media:hide', {
			value: {
				id,
				actor
			}
		})
	},

	setDefaultZoom(id, zoom) {
		return Dispatcher.trigger('media:setDefaultZoom', {
			value: {
				id,
				zoom
			}
		})
	},

	setZoom(id, zoom) {
		return Dispatcher.trigger('media:setZoom', {
			value: {
				id,
				zoom
			}
		})
	},

	resetZoom(id) {
		return Dispatcher.trigger('media:resetZoom', {
			value: {
				id
			}
		})
	},

	isZoomAtDefault(state, model) {
		return MediaUtil.getDefaultZoom(state, model) === MediaUtil.getZoom(state, model)
	},

	getDefaultZoom(state, model) {
		if (typeof state.defaultZoomById[model.get('id')] === 'undefined') return DEFAULT_ZOOM
		return state.defaultZoomById[model.get('id')]
	},

	getZoom(state, model) {
		if (typeof state.zoomById[model.get('id')] === 'undefined') {
			return MediaUtil.getDefaultZoom(state, model)
		}

		return state.zoomById[model.get('id')]
	},

	isShowingMedia(state, model) {
		return state.shown[model.get('id')] === true
	}
}

export default MediaUtil
