jest.mock('../../../src/scripts/common/flux/dispatcher')
jest.mock('../../../src/scripts/common/models/obo-model')
jest.mock('../../../src/scripts/viewer/util/viewer-api')
jest.mock('../../../src/scripts/viewer/stores/nav-store', () => ({
	getState: () => ({
		visitId: 'mock-visit-id'
	})
}))

import MediaStore from '../../../src/scripts/viewer/stores/media-store'
import ViewerAPI from '../../../src/scripts/viewer/util/viewer-api'
import Dispatcher from '../../../src/scripts/common/flux/dispatcher'
import OboModel from '../../../src/scripts/common/models/obo-model'

describe('Media Store', () => {
	beforeEach(() => {
		jest.resetAllMocks()

		MediaStore.init()
		OboModel.models = {
			'mocked-id': {
				getRoot: () => ({
					get: () => 'root-id'
				}),
				get: () => 'mocked-id'
			}
		}
		OboModel.getRoot = () => ({
			get: () => 'root-id'
		})
	})

	test('init will init state', () => {
		MediaStore.state = {}
		MediaStore.init()

		expect(MediaStore.state).toEqual({
			shown: {},
			zoomById: {},
			defaultZoomById: {}
		})
	})

	test('setState will set state', () => {
		MediaStore.state = {}
		MediaStore.setState({ a: 1 })

		expect(MediaStore.state).toEqual({
			a: 1
		})
	})

	test('getState will get state', () => {
		MediaStore.state = { a: 1 }
		expect(MediaStore.getState()).toEqual({
			a: 1
		})
	})

	test('Dispatcher listening for the right events', () => {
		MediaStore.constructor()
		expect(Dispatcher.on).toHaveBeenCalledWith({
			'media:show': expect.any(Function),
			'media:hide': expect.any(Function),
			'media:setZoom': expect.any(Function),
			'media:resetZoom': expect.any(Function),
			'media:setDefaultZoom': expect.any(Function),
			'media:play': expect.any(Function),
			'media:end': expect.any(Function),
			'media:pause': expect.any(Function),
			'media:seekTo': expect.any(Function),
			'media:buffer': expect.any(Function),
			'media:unload': expect.any(Function)
		})
	})

	test('show', () => {
		MediaStore.show({
			value: { id: 'mocked-id' }
		})

		expect(MediaStore.state).toEqual({
			shown: { 'mocked-id': true },
			defaultZoomById: {},
			zoomById: {}
		})
		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:show',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				id: 'mocked-id'
			}
		})
		expect(Dispatcher.trigger).toHaveBeenCalledWith('media:shown', {
			id: 'mocked-id'
		})
	})

	test('hide', () => {
		MediaStore.state = {
			shown: { 'mocked-id': true, 'other-id': true },
			zoomById: { 'mocked-id': 2, 'other-id': 0.5 },
			defaultZoomById: { 'mocked-id': 1, 'other-id': 2 }
		}
		MediaStore.hide({
			value: { id: 'mocked-id', actor: 'mocked-actor' }
		})

		expect(MediaStore.state).toEqual({
			shown: { 'other-id': true },
			zoomById: { 'other-id': 0.5 },
			defaultZoomById: { 'other-id': 2 }
		})
		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:hide',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				id: 'mocked-id',
				actor: 'mocked-actor'
			}
		})
		expect(Dispatcher.trigger).toHaveBeenCalledWith('media:hidden', {
			id: 'mocked-id',
			actor: 'mocked-actor'
		})
	})

	test('hide (no actor)', () => {
		MediaStore.hide({
			value: { id: 'mocked-id' }
		})

		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:hide',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				id: 'mocked-id',
				actor: 'user'
			}
		})
		expect(Dispatcher.trigger).toHaveBeenCalledWith('media:hidden', {
			id: 'mocked-id',
			actor: 'user'
		})
	})

	test('setZoom (to a set value)', () => {
		MediaStore.setZoom({
			value: { id: 'mocked-id', zoom: 2 }
		})

		expect(MediaStore.state).toEqual({
			shown: {},
			zoomById: { 'mocked-id': 2 },
			defaultZoomById: {}
		})
		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:setZoom',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				id: 'mocked-id',
				previousZoom: 1,
				zoom: 2
			}
		})
		expect(Dispatcher.trigger).toHaveBeenCalledWith('media:zoomChanged', {
			id: 'mocked-id',
			zoom: 2,
			previousZoom: 1
		})
	})

	test('setting zoom to null does nothing', () => {
		MediaStore.state.zoomById['mocked-id'] = 'other-zoom'
		MediaStore.setZoom({
			value: { id: 'mocked-id', zoom: null }
		})

		expect(MediaStore.state).toEqual({
			shown: {},
			zoomById: {
				'mocked-id': 'other-zoom'
			},
			defaultZoomById: {}
		})
		expect(ViewerAPI.postEvent).not.toHaveBeenCalled()
		expect(Dispatcher.trigger).not.toHaveBeenCalled()
	})

	test('setZoom (to value <= 0)', () => {
		MediaStore.setZoom({
			value: { id: 'mocked-id', zoom: 0 }
		})

		expect(MediaStore.state).toEqual({
			shown: {},
			zoomById: {},
			defaultZoomById: {}
		})
		expect(ViewerAPI.postEvent).not.toHaveBeenCalled()
		expect(Dispatcher.trigger).not.toHaveBeenCalled()
	})

	test('setZoom (to an invalid value)', () => {
		MediaStore.setZoom({ value: { id: 'mocked-id', zoom: 'invalid-value' } })

		expect(MediaStore.state).toEqual({
			shown: {},
			zoomById: {},
			defaultZoomById: {}
		})
		expect(ViewerAPI.postEvent).not.toHaveBeenCalled()
		expect(Dispatcher.trigger).not.toHaveBeenCalled()
	})

	test('resetZoom', () => {
		MediaStore.state.zoomById['mocked-id'] = 'mocked-zoom'
		MediaStore.resetZoom({
			value: { id: 'mocked-id' }
		})

		expect(MediaStore.state).toEqual({
			shown: {},
			zoomById: {
				'mocked-id': 1
			},
			defaultZoomById: {}
		})
		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:resetZoom',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				id: 'mocked-id',
				previousZoom: 'mocked-zoom',
				zoom: 1
			}
		})
		expect(Dispatcher.trigger).toHaveBeenCalledWith('media:zoomResetted', {
			id: 'mocked-id',
			previousZoom: 'mocked-zoom',
			zoom: 1
		})
	})

	test('resetZoom (with default)', () => {
		MediaStore.state.zoomById['mocked-id'] = 0.5
		MediaStore.state.defaultZoomById['mocked-id'] = 2
		MediaStore.resetZoom({ value: { id: 'mocked-id' } })

		expect(MediaStore.state).toEqual({
			shown: {},
			zoomById: {
				'mocked-id': 2
			},
			defaultZoomById: {
				'mocked-id': 2
			}
		})
		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:resetZoom',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				id: 'mocked-id',
				previousZoom: 0.5,
				zoom: 2
			}
		})
		expect(Dispatcher.trigger).toHaveBeenCalledWith('media:zoomResetted', {
			id: 'mocked-id',
			previousZoom: 0.5,
			zoom: 2
		})
	})

	test('resetZoom works even if no zoom previously set', () => {
		MediaStore.resetZoom({
			value: { id: 'mocked-id' }
		})

		expect(MediaStore.state).toEqual({
			shown: {},
			zoomById: {
				'mocked-id': 1
			},
			defaultZoomById: {}
		})
		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:resetZoom',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				id: 'mocked-id',
				previousZoom: 1,
				zoom: 1
			}
		})
		expect(Dispatcher.trigger).toHaveBeenCalledWith('media:zoomResetted', {
			id: 'mocked-id',
			previousZoom: 1,
			zoom: 1
		})
	})

	test('setDefaultZoom', () => {
		MediaStore.setDefaultZoom({ value: { id: 'mocked-id', zoom: 2 } })

		expect(MediaStore.state).toEqual({
			shown: {},
			zoomById: {},
			defaultZoomById: {
				'mocked-id': 2
			}
		})
		expect(ViewerAPI.postEvent).not.toHaveBeenCalled()
		expect(Dispatcher.trigger).toHaveBeenCalledWith('media:defaultZoomSet', {
			id: 'mocked-id',
			zoom: 2
		})
	})

	test('setDefaultZoom to an invalid value', () => {
		MediaStore.setDefaultZoom({ value: { id: 'mocked-id', zoom: 0 } })

		expect(MediaStore.state).toEqual({
			shown: {},
			zoomById: {},
			defaultZoomById: {
				'mocked-id': 1
			}
		})
		expect(ViewerAPI.postEvent).not.toHaveBeenCalled()
		expect(Dispatcher.trigger).toHaveBeenCalledWith('media:defaultZoomSet', {
			id: 'mocked-id',
			zoom: 1
		})
	})

	test('media played', () => {
		MediaStore.play({
			value: {
				actor: 'user',
				playheadPosition: 2,
				url: 'mocked-url',
				nodeId: 'mocked-id'
			}
		})

		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:play',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				actor: 'user',
				playheadPosition: 2,
				url: 'mocked-url',
				nodeId: 'mocked-id'
			}
		})
	})

	test('media paused', () => {
		MediaStore.pause({
			value: {
				actor: 'user',
				playheadPosition: 0,
				url: 'mocked-url',
				nodeId: 'mocked-id'
			}
		})

		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:pause',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				actor: 'user',
				playheadPosition: 0,
				url: 'mocked-url',
				nodeId: 'mocked-id'
			}
		})
	})

	test('media ended', () => {
		MediaStore.end({
			value: {
				actor: 'youtube',
				playheadPosition: 100,
				url: 'mocked-url',
				nodeId: 'mocked-id'
			}
		})

		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:end',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				actor: 'youtube',
				playheadPosition: 100,
				url: 'mocked-url',
				nodeId: 'mocked-id'
			}
		})
	})

	test('media seekTo', () => {
		MediaStore.seekTo({
			value: {
				actor: 'user',
				playheadPosition: 100,
				previousPlayheadPosition: 0,
				url: 'mocked-url',
				nodeId: 'mocked-id'
			}
		})

		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:seekTo',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				actor: 'user',
				playheadPosition: 100,
				previousPlayheadPosition: 0,
				url: 'mocked-url',
				nodeId: 'mocked-id'
			}
		})
	})

	test('media buffering', () => {
		MediaStore.buffer({
			value: {
				actor: 'youtube',
				playheadPosition: 50,
				url: 'mocked-url',
				nodeId: 'mocked-id'
			}
		})

		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:buffer',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				actor: 'youtube',
				playheadPosition: 50,
				url: 'mocked-url',
				nodeId: 'mocked-id'
			}
		})
	})

	test('media unloaded', () => {
		MediaStore.unload({
			value: {
				actor: 'user',
				playheadPosition: 0,
				url: 'mocked-url',
				nodeId: 'mocked-id'
			}
		})

		expect(ViewerAPI.postEvent).toHaveBeenCalledWith({
			draftId: 'root-id',
			action: 'media:unload',
			eventVersion: '1.0.0',
			visitId: 'mock-visit-id',
			payload: {
				actor: 'user',
				playheadPosition: 0,
				url: 'mocked-url',
				nodeId: 'mocked-id'
			}
		})
	})
})
