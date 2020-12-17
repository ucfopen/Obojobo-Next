jest.mock('../../../src/scripts/oboeditor/components/visual-editor')
jest.mock('../../../src/scripts/oboeditor/components/code-editor')
jest.mock('../../../src/scripts/viewer/util/editor-api')
jest.mock('../../../src/scripts/oboeditor/stores/editor-store')
jest.mock('../../../src/scripts/common/stores/modal-store')
jest.mock('../../../src/scripts/common/util/modal-util')
jest.mock('../../../src/scripts/common/models/obo-model')
jest.mock('../../../src/scripts/oboeditor/util/editor-util')

import React from 'react'
import { mount } from 'enzyme'

describe('EditorApp', () => {
	const XML_MODE = 'xml'
	const testObject = require('test-object.json')
	const testObjectString = JSON.stringify({ value: testObject })
	const msPerSec = 60000
	const ogConsoleError = console.error // eslint-disable-line no-console

	let defaultProps
	let EditorAPI
	let EditorStore
	let ModalStore
	let ModalUtil
	let EditorUtil
	let Common
	let EditorApp
	let defaultModel
	let defaultEditorState

	beforeEach(() => {
		jest.resetAllMocks()
		jest.resetModules()

		EditorUtil = require('../../../src/scripts/oboeditor/util/editor-util').default
		EditorAPI = require('../../../src/scripts/viewer/util/editor-api').default
		EditorStore = require('../../../src/scripts/oboeditor/stores/editor-store').default
		ModalStore = require('../../../src/scripts/common/stores/modal-store').default
		ModalUtil = require('../../../src/scripts/common/util/modal-util').default
		Common = require('../../../src/scripts/common').default
		EditorApp = require('../../../src/scripts/oboeditor/components/editor-app').default

		defaultModel = {
			modelState: { start: 'mockStart' },
			get: jest.fn(),
			set: jest.fn()
		}

		defaultProps = {
			settings: {
				editLocks: {
					dbLockDurationMinutes: 1,
					idleTimeUntilWarningMinutes: 2,
					idleTimeUntilReleaseLockMinutes: 3
				}
			}
		}

		defaultEditorState = {
			currentPageModel: {},
			context: {}
		}

		EditorAPI.requestEditLock.mockResolvedValue({ status: 'ok' })
		Common.models.OboModel.create.mockReturnValue(defaultModel)
		EditorStore.getState.mockReturnValue(defaultEditorState)
		ModalStore.getState.mockReturnValue({})
		EditorUtil.getTitleFromString.mockReturnValue('mock-title-from-string')
	})

	afterEach(() => {
		jest.clearAllTimers()
		jest.clearAllMocks()
		console.error = ogConsoleError // eslint-disable-line no-console
	})

	test('component renders', () => {
		expect.hasAssertions()

		// mock some plugins
		const spyGetItems = jest.spyOn(Common.Registry, 'getItems')
		spyGetItems.mockImplementationOnce(cb => {
			cb([{ plugins: 'mock-plugin' }, { noplugins: 'mock-plugin' }])
		})

		// mock api calls
		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		EditorStore.getState.mockReturnValueOnce({})

		// mount
		const component = mount(<EditorApp {...defaultProps} />)

		// verify
		return global.flushPromises().then(() => {
			component.update()

			expect(component.html()).toMatchSnapshot()

			component.unmount()
		})
	})

	test('component should request null draft when draftid not in pathname', () => {
		expect.hasAssertions()

		// update document.location to cause no draftId
		window.history.pushState({}, null, '/pathname?k=v')

		// mock api calls
		EditorAPI.getFullDraft
			.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
			.mockResolvedValueOnce(
				'<?xml version="1.0" encoding="utf-8"?><ObojoboDraftDoc></ObojoboDraftDoc>'
			)
		EditorStore.getState.mockReturnValueOnce({})

		// mount
		const component = mount(<EditorApp {...defaultProps} />)
		component.instance().switchMode(XML_MODE)

		// verify
		return global.flushPromises().then(() => {
			component.update()
			expect(EditorAPI.getFullDraft).toHaveBeenCalledWith(null, 'json')
			component.unmount()
		})
	})

	test('EditorApp component displays xml in xml mode', () => {
		expect.hasAssertions()

		const mockXMLDraft = '<?xml version="1.0" encoding="utf-8"?><ObojoboDraftDoc></ObojoboDraftDoc>'

		EditorAPI.getFullDraft
			.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
			.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		EditorStore.getState.mockReturnValueOnce(mockXMLDraft)

		const component = mount(<EditorApp {...defaultProps} />)
		component.instance().switchMode(XML_MODE)

		return global.flushPromises().then(() => {
			component.update()
			expect(component.html()).toMatchSnapshot()
			component.unmount()
		})
	})

	test('onEditorStoreChange calls Editor.getState', () => {
		expect.hasAssertions()

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		EditorStore.getState.mockReturnValueOnce({}).mockReturnValueOnce({})

		const component = mount(<EditorApp {...defaultProps} />)
		return global.flushPromises().then(() => {
			component.update()

			component.instance().onEditorStoreChange()
			expect(EditorStore.getState).toHaveBeenCalled()

			component.unmount()
		})
	})

	test('onModalStoreChange calls ModalStore.getState', () => {
		expect.hasAssertions()

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		EditorStore.getState.mockReturnValueOnce({}).mockReturnValueOnce({})
		ModalStore.getState.mockReturnValueOnce({}).mockReturnValueOnce({})

		const component = mount(<EditorApp {...defaultProps} />)
		return global.flushPromises().then(() => {
			component.update()

			component.instance().onModalStoreChange()
			expect(ModalStore.getState).toHaveBeenCalled()

			component.unmount()
		})
	})

	test('onEditorStoreChange calls Editor.getState', () => {
		expect.hasAssertions() // here

		ModalUtil.getCurrentModal.mockReturnValueOnce({
			component: 'mock component'
		})

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		EditorStore.getState.mockReturnValueOnce({}).mockReturnValueOnce({})

		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()

		return global.flushPromises().then(() => {
			component.update()
			EditorStore.getState.mockClear()
			component.instance().onEditorStoreChange() // here
			expect(EditorStore.getState).toHaveBeenCalled()
			expect(instance.state).toHaveProperty('requestStatus', null)
			expect(instance.state).toHaveProperty('requestError', null)
			// eslint-disable-next-line no-console
		})
	})

	test('EditorApp component renders error messsage', () => {
		expect.hasAssertions()

		const mockError = { type: 'someType', message: 'someMessage' }
		EditorAPI.getFullDraft.mockResolvedValueOnce({
			contentId: 0,
			body: JSON.stringify({
				status: 'error',
				value: mockError
			})
		})

		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()
		console.error = jest.fn() // eslint-disable-line no-console

		return global.flushPromises().then(() => {
			component.update()
			const html = component.html()
			expect(html).toContain('Error')
			expect(html).toContain('Error')
			expect(console.error).toHaveBeenCalled() // eslint-disable-line no-console
			expect(instance.state).toHaveProperty('requestStatus', 'invalid')
			expect(instance.state).toHaveProperty('requestError.type', 'someType')
			expect(instance.state).toHaveProperty('requestError.message', 'someMessage')
			component.unmount()
		})
	})

	test('EditorApp component renders modal', () => {
		expect.hasAssertions() // here

		jest.spyOn(Common.models.OboModel, 'create')
		Common.models.OboModel.create.mockReturnValueOnce({
			modelState: { start: 'mockStart' }
		})

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		EditorStore.getState.mockReturnValueOnce({})

		ModalUtil.getCurrentModal.mockReturnValueOnce({
			component: 'mock component'
		})

		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()

		return global.flushPromises().then(() => {
			component.update()
			console.log(component)
			expect(component.html()).toMatchSnapshot() // here
			expect(instance.state).toHaveProperty('requestStatus', null)
			expect(instance.state).toHaveProperty('requestError', null)
			// eslint-disable-next-line no-console
			component.unmount()
		})
	})

	test('EditorApp calls displayLockedModal when module is locked', () => {
		expect.hasAssertions()
		EditorAPI.requestEditLock.mockResolvedValue({
			status: 'error',
			value: { message: 'mock-message' }
		})

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })

		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()
		return global.flushPromises().then(() => {
			component.update()
			// make sure the error is displayed
			expect(component.html()).toContain('Unable to Edit Module')
			expect(component.html()).toContain('mock-message')

			// make sure state has the error message
			expect(instance.state).toHaveProperty('requestStatus', 'invalid')
			expect(instance.state).toHaveProperty('requestError')
			expect(instance.state.requestError).toMatchInlineSnapshot(`
			Object {
			  "message": "mock-message",
			  "title": "Unable to Edit Module",
			}
		`)

			component.unmount()
		})
	})

	test('EditorApp calls displayLockedModal when locking throws an error', () => {
		expect.hasAssertions()
		EditorAPI.requestEditLock.mockResolvedValue({ status: 'error' })

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })

		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()
		return global.flushPromises().then(() => {
			component.update()
			// make sure the error is displayed
			expect(component.html()).toContain('Unable to Edit Module')
			expect(component.html()).toContain('Unable to lock module.')

			// make sure state has the error message
			expect(instance.state).toHaveProperty('requestStatus', 'invalid')
			expect(instance.state).toHaveProperty('requestError')
			expect(instance.state.requestError).toMatchInlineSnapshot(`
			Object {
			  "message": "Unable to lock module.",
			  "title": "Unable to Edit Module",
			}
		`)

			component.unmount()
		})
	})

	test('startRenewEditLockInterval is called when on mount', () => {
		expect.hasAssertions()

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })

		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()

		// we can spy on this method because the promise hasn't resolved yet
		const startRenewEditLockInterval = jest.spyOn(instance, 'startRenewEditLockInterval')
		startRenewEditLockInterval.mockReturnValueOnce()
		jest.spyOn(instance, 'reloadDraft').mockResolvedValueOnce()

		return global.flushPromises().then(() => {
			expect(startRenewEditLockInterval).toHaveBeenCalledTimes(1)
			component.unmount()
		})
	})

	test('startRenewEditLockInterval calls requestEditLock', () => {
		expect.hasAssertions()
		jest.useFakeTimers()
		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		const component = mount(<EditorApp {...defaultProps} />)
		// mock reloadDraft just to simplify the test
		jest.spyOn(component.instance(), 'reloadDraft').mockResolvedValueOnce()

		return global.flushPromises().then(() => {
			expect(EditorAPI.requestEditLock).toHaveBeenCalledTimes(1)

			// move forward to just before the timeout
			jest.advanceTimersByTime(msPerSec * 1 * 0.9 - 1)
			expect(EditorAPI.requestEditLock).toHaveBeenCalledTimes(1)

			// move forward to the timeout
			jest.advanceTimersByTime(1)
			expect(EditorAPI.requestEditLock).toHaveBeenCalledTimes(2)

			// move forward to the next timeout
			jest.advanceTimersByTime(msPerSec * 1 * 0.9)
			expect(EditorAPI.requestEditLock).toHaveBeenCalledTimes(3)

			component.unmount()
		})
	})

	test('startRenewEditLockInterval skips createEditLock when already locking', () => {
		expect.hasAssertions()
		jest.useFakeTimers()
		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()
		// mock reloadDraft just to simplify the test
		jest.spyOn(instance, 'reloadDraft').mockResolvedValueOnce()
		jest.spyOn(instance, 'createEditLock').mockResolvedValueOnce()
		instance._isCreatingRenewableEditLock = true

		return global.flushPromises().then(() => {
			expect(instance.createEditLock).not.toHaveBeenCalled()

			// now turn it off and call the function directy to test that it does get called
			instance._isCreatingRenewableEditLock = false
			instance.startRenewEditLockInterval('test')
			expect(instance.createEditLock).toHaveBeenCalled()
		})
	})

	test('component loads draft revision', () => {
		expect.hasAssertions()
		jest.useFakeTimers()
		window.history.pushState({}, null, '/api/drafts/mock-draft-id/whatever')
		EditorAPI.getDraftRevision.mockResolvedValueOnce({ value: { json: testObject } })
		EditorStore.getState.mockReturnValueOnce({})

		defaultProps.settings.revisionId = 'mock-revision-id'
		const spy = jest.spyOn(EditorApp.prototype, 'loadDraftRevision')
		const component = mount(<EditorApp {...defaultProps} />)

		// eslint-disable-next-line no-undef
		return flushPromises().then(() => {
			component.update()

			expect(spy).toHaveBeenCalled()
			expect(EditorAPI.getDraftRevision).toHaveBeenCalledWith('mock-draft-id', 'mock-revision-id')
			expect(component.state().mode).toEqual('visual')
			expect(component.state().draft).toEqual(testObject)

			component.unmount()
		})
	})

	test('startRenewEditLockInterval displays error when interval is unable to secure lock', () => {
		expect.hasAssertions()
		jest.useFakeTimers()
		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()
		// mock reloadDraft just to simplify the test
		jest.spyOn(instance, 'reloadDraft').mockResolvedValueOnce()

		return global.flushPromises().then(() => {
			// now simulate not being able to obtain a lock
			EditorAPI.requestEditLock.mockResolvedValueOnce({ status: 'error' })

			// make sure we're not in an error state
			expect(instance.state).toHaveProperty('requestStatus', null)

			//move forward to the next timeout
			jest.advanceTimersByTime(msPerSec * 1 * 0.9)
			expect(EditorAPI.requestEditLock).toHaveBeenCalledTimes(2)

			return global.flushPromises().then(() => {
				// make sure state has the error message
				expect(instance.state).toHaveProperty('requestStatus', 'invalid')
				expect(instance.state).toHaveProperty('requestError')
				expect(instance.state.requestError).toMatchInlineSnapshot(`
				Object {
				  "message": "Unable to lock module.",
				  "title": "Unable to Edit Module",
				}
			`)
				component.unmount()
			})
		})
	})

	test('saveDraft updates the components contentId', () => {
		expect.hasAssertions()
		EditorAPI.getDraftRevision.mockResolvedValueOnce({ status: 'error' })
		EditorStore.getState.mockReturnValueOnce({})

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		EditorAPI.postDraft.mockResolvedValueOnce({
			contentId: 'mock-saved-content-id',
			result: {
				status: 'ok',
				value: {
					id: 'mock-content-id'
				}
			}
		})

		// mount
		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()
		instance.state.model = defaultModel

		// verify
		return instance.saveDraft('mock-draft-id', 'mock-data-src').then(success => {
			expect(success).toBe(true)
			expect(instance.contentId).toBe('mock-saved-content-id')
			expect(EditorAPI.postDraft).toHaveBeenCalledWith(
				'mock-draft-id',
				'mock-data-src',
				'application/json'
			)
			component.unmount()
		})
	})

	test('saveDraft shows dialog on ', () => {
		expect.hasAssertions()

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		EditorAPI.postDraft.mockResolvedValueOnce({
			contentId: 'mock-saved-content-id',
			result: {
				status: 'error',
				value: {
					message: 'mock-error-message'
				}
			}
		})

		// mount
		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()
		instance.state.model = defaultModel

		// verify
		return instance.saveDraft('mock-draft-id', 'mock-data-src', 'json').then(success => {
			expect(success).toBe(false)
			expect(defaultModel.set).not.toHaveBeenCalled()
			expect(ModalUtil.show).toHaveBeenCalled()
			component.unmount()
		})
	})

	test('saveDraft sends correct mode to postDraft for xml', () => {
		expect.hasAssertions()

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		EditorAPI.postDraft.mockResolvedValueOnce({
			contentId: 'mock-saved-content-id',
			result: {
				status: 'error',
				value: {
					message: 'mock-error-message'
				}
			}
		})

		// mount
		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()

		// verify
		return instance.saveDraft('mock-draft-id', 'mock-data-src', 'xml').then(() => {
			expect(EditorAPI.postDraft).toHaveBeenCalledWith(
				'mock-draft-id',
				'mock-data-src',
				'text/plain'
			)
			component.unmount()
		})
	})

	test('onWindowClose sends becon', () => {
		expect.hasAssertions()

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })

		// mount
		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()
		instance.state.draftId = 'mock-draft-id'

		// verify
		instance.onWindowClose()
		expect(EditorAPI.deleteLockBeacon).toHaveBeenCalledWith('mock-draft-id')
	})

	test('onWindowInactive sends becon, hides modal and shows expiration modal', () => {
		expect.hasAssertions()

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })

		// mount
		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()
		instance.state.draftId = 'mock-draft-id'

		// verify
		instance.onWindowInactive()
		expect(EditorAPI.deleteLockBeacon).toHaveBeenCalledWith('mock-draft-id')
		expect(ModalUtil.hide).toHaveBeenCalled()
		expect(ModalUtil.show).toHaveBeenCalled()
	})

	test('onWindowInactiveWarning shows a modal', () => {
		expect.hasAssertions()

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })

		// mount
		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()
		instance.state.draftId = 'mock-draft-id'

		// verify
		instance.onWindowInactiveWarning()
		expect(ModalUtil.show).toHaveBeenCalled()
	})

	test('onWindowReturnFromInactive renews lock interval and hides modals', () => {
		expect.hasAssertions()

		EditorAPI.getFullDraft.mockResolvedValueOnce({ contentId: 0, body: testObjectString })
		// mount
		const component = mount(<EditorApp {...defaultProps} />)
		const instance = component.instance()
		jest.spyOn(instance, 'startRenewEditLockInterval')
		instance.startRenewEditLockInterval.mockResolvedValueOnce()
		instance.state.draftId = 'mock-draft-id'

		// verify
		return instance.onWindowReturnFromInactive().then(() => {
			expect(instance.startRenewEditLockInterval).toHaveBeenCalledWith('mock-draft-id')
			expect(ModalUtil.hide).toHaveBeenCalled()
		})
	})

	test('EditorApp renders error when loading draft revision', () => {
		expect.assertions(5)
		jest.useFakeTimers()
		EditorAPI.getDraftRevision.mockResolvedValueOnce({
			status: 'error',
			value: { type: 'mock-type', message: 'mock-message' }
		})
		EditorStore.getState.mockReturnValueOnce({})
		defaultProps.settings.revisionId = 'mockId'
		console.error = jest.fn() // eslint-disable-line no-console
		const spy = jest.spyOn(EditorApp.prototype, 'loadDraftRevision')
		const component = mount(<EditorApp {...defaultProps} />)

		return global.flushPromises().then(() => {
			component.update()

			expect(spy).toHaveBeenCalled()
			expect(component.state().requestStatus).toEqual('invalid')
			expect(component.state()).toHaveProperty('requestError.message', 'mock-message')
			expect(component.state()).toHaveProperty('requestError.type', 'mock-type')
			expect(component.state().mode).toEqual('visual')

			component.unmount()
		})
	})
})
