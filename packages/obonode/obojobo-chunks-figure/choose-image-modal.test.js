import React from 'react'
import { mount } from 'enzyme'
import ChooseImageModal from './choose-image-modal'

// mock with empty object
jest.mock('obojobo-document-engine/src/scripts/viewer/util/api', () => ({}))

describe('Choose Image Modal', () => {
	const flushPromises = global.flushPromises // pevents eslint no-undef errors
	const API = require('obojobo-document-engine/src/scripts/viewer/util/api')

	beforeEach(() => {
		jest.resetAllMocks()
		;(API.postMultiPart = jest.fn().mockResolvedValue({ media_id: 'mockMediaId' })),
			(API.get = jest.fn().mockResolvedValue({
				json: jest
					.fn()
					.mockResolvedValueOnce({ media: [{ id: '1', fileName: 'file-name-1' }], hasMore: true })
					.mockResolvedValueOnce({ media: [{ id: '2', fileName: 'file-name-2' }], hasMore: false })
			}))
	})

	test('ChooseImageModal component', () => {
		const component = mount(<ChooseImageModal />)

		return flushPromises().then(() => {
			expect(component.html()).toMatchSnapshot()
		})
	})

	test('ChooseImageModal component focuses on first element', () => {
		const component = mount(<ChooseImageModal onConfirm={jest.fn} />)

		component.instance().focusOnFirstElement()

		return flushPromises().then(() => {
			expect(component.html()).toMatchSnapshot()
		})
	})

	test('ImageProperties component changes url', () => {
		const component = mount(<ChooseImageModal onConfirm={jest.fn} />)

		component
			.find('#choose-image--image-controls--url')
			.simulate('change', { target: { value: 'changed url' } })

		return flushPromises().then(() => {
			expect(component.instance().state.url).toBe('changed url')
		})
	})

	test('ImageProperties component changes file', () => {
		const onCloseChooseImageModal = jest.fn()
		const component = mount(<ChooseImageModal onCloseChooseImageModal={onCloseChooseImageModal} />)

		component.find('#fileupload').simulate('change', {
			target: {
				value: 'changed',
				files: [
					new window.Blob([JSON.stringify({ name: 'mockFileName' })], { type: 'application/json' })
				]
			}
		})

		return flushPromises().then(() => {
			expect(API.postMultiPart).toHaveBeenCalledTimes(1)
			// eslint-disable-next-line no-undef
			expect(API.postMultiPart).toHaveBeenCalledWith('/api/media/upload', expect.any(FormData))
			expect(onCloseChooseImageModal).toHaveBeenCalledWith('mockMediaId')
			expect(component.html()).toMatchSnapshot()
		})
	})

	test('ImageProperties click on `View More...`', () => {
		const onCloseChooseImageModal = jest.fn()
		const component = mount(<ChooseImageModal onCloseChooseImageModal={onCloseChooseImageModal} />)

		component.setState({ medias: [{ id: 'mock_id' }], isFetching: false, hasMore: true })

		expect(component.instance().state.hasMore).toBe(true)

		jest.clearAllMocks()
		component.find('.choose-image--image-gallary--view-more-btn').simulate('click')
		expect(component.instance().state.isFetching).toBe(true)

		return flushPromises().then(() => {
			expect(component.instance().state.isFetching).toBe(false)
			expect(API.get).toHaveBeenCalledTimes(1)
			expect(API.get).toHaveBeenCalledWith('/api/media/all?page=1&per_page=11')
			expect(component.instance().state.media).toMatchInlineSnapshot(`
			Array [
			  Object {
			    "fileName": "file-name-1",
			    "id": "1",
			  },
			  Object {
			    "fileName": "file-name-2",
			    "id": "2",
			  },
			]
		`)

			expect(component.html()).toMatchSnapshot()
		})
	})

	test('ImageProperties click on `Cancel`', () => {
		const onCloseChooseImageModal = jest.fn()
		const component = mount(<ChooseImageModal onCloseChooseImageModal={onCloseChooseImageModal} />)

		component
			.find('button')
			.at(1)
			.simulate('click')

		return flushPromises().then(() => {
			expect(onCloseChooseImageModal).toHaveBeenCalled()
			expect(component.html()).toMatchSnapshot()
		})
	})

	test('ImageProperties click on `OK`', () => {
		const onCloseChooseImageModal = jest.fn()
		const component = mount(<ChooseImageModal onCloseChooseImageModal={onCloseChooseImageModal} />)

		component
			.find('button')
			.at(2)
			.simulate('click')

		return flushPromises().then(() => {
			expect(onCloseChooseImageModal).toHaveBeenCalled()
			expect(component.html()).toMatchSnapshot()
		})
	})

	test('ImageProperties click on an image', () => {
		const onCloseChooseImageModal = jest.fn()
		const component = mount(<ChooseImageModal onCloseChooseImageModal={onCloseChooseImageModal} />)

		component.setState({
			media: [{ id: 'mock_id', fileName: 'mock-file-name' }],
			isFetching: false,
			hasMore: false
		})
		component.find('.image-gallary--single-photo').simulate('click')

		return flushPromises().then(() => {
			expect(onCloseChooseImageModal).toHaveBeenCalled()
			expect(component.html()).toMatchSnapshot()
		})
	})

	test('ImageProperties onPress that are not `Enter` on an image', () => {
		const onCloseChooseImageModal = jest.fn()
		const component = mount(<ChooseImageModal onCloseChooseImageModal={onCloseChooseImageModal} />)

		component.setState({
			media: [{ id: 'mock_id', fileName: 'mock-file-name' }],
			isFetching: false,
			hasMore: false
		})

		component
			.find('.image-gallary--single-photo')
			.at(0)
			.simulate('keypress', { key: 'mock_key' })

		return flushPromises().then(() => {
			expect(component.html()).toMatchSnapshot()
		})
	})

	test('ImageProperties onKeyPress `Enter` on an image', () => {
		const onCloseChooseImageModal = jest.fn()
		const component = mount(<ChooseImageModal onCloseChooseImageModal={onCloseChooseImageModal} />)

		component.setState({
			media: [{ id: 'mock_id', fileName: 'mock-file-name' }],
			isFetching: false,
			hasMore: false
		})
		component
			.find('.image-gallary--single-photo')
			.at(0)
			.simulate('keypress', { key: 'Enter' })

		return flushPromises().then(() => {
			expect(onCloseChooseImageModal).toHaveBeenCalled()
			expect(component.html()).toMatchSnapshot()
		})
	})

	test('ImageProperties handle fetching error', () => {
		API.get = jest.fn().mockResolvedValue({
			json: jest.fn().mockResolvedValue({ status: 'error' })
		})

		const component = mount(
			<ChooseImageModal onSetIsChoosingImage={jest.fn} onSetMediaUrl={jest.fn} />
		)

		return flushPromises().then(() => {
			expect(component.instance().state.isFetching).toBe(false)
			expect(component.instance().state.hasMore).toBe(false)
			expect(component.html()).toMatchSnapshot()
		})
	})

	test('ImageProperties handle promise rejection', () => {
		API.get = jest.fn().mockRejectedValueOnce('mock-error')

		const component = mount(
			<ChooseImageModal onSetIsChoosingImage={jest.fn} onSetMediaUrl={jest.fn} />
		)

		return flushPromises().then(() => {
			expect(component.instance().state.isFetching).toBe(false)
			expect(component.instance().state.hasMore).toBe(false)
			expect(component.html()).toMatchSnapshot()
		})
	})
})
