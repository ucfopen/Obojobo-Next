jest.mock('short-uuid')

import React from 'react'
import CollectionMenu from './collection-menu'
import { mount } from 'enzyme'

describe('CollectionMenu', () => {
	const mockShortFromUUID = jest.fn()

	let defaultProps
	let short

	const originalConfirm = window.confirm
	beforeAll(() => {
		window.confirm = jest.fn()
	})
	afterAll(() => {
		window.confirm = originalConfirm
	})

	beforeEach(() => {
		jest.resetAllMocks()

		defaultProps = {
			collection: {
				id: 'mockCollectionId',
				title: 'Mock Collection Title'
			},
			showCollectionManageModules: jest.fn(),
			showCollectionRename: jest.fn(),
			deleteCollection: jest.fn()
		}

		short = require('short-uuid')
		mockShortFromUUID.mockReturnValue('mockCollectionShortId')
		short.mockReturnValue({
			fromUUID: mockShortFromUUID
		})
	})

	test('CollectionMenu renders correctly with standard expected props', () => {
		const component = mount(<CollectionMenu {...defaultProps} />)

		const menuDiv = component
			.find('.repository--module-icon--menu-wrapper')
			.children()
			.at(0)

		expect(menuDiv.prop('className')).toBe('repository--module-icon--menu ')

		expect(mockShortFromUUID).toHaveBeenCalledTimes(1)
		expect(mockShortFromUUID).toHaveBeenCalledWith('mockCollectionId')

		const expectedUrl = '/collections/mock-collection-title-mockCollectionShortId'
		expect(component.find('ButtonLink').prop('url')).toBe(expectedUrl)
	})

	test('CollectionMenu renders correctly with standard expected props and className', () => {
		defaultProps.className = 'mockExtraClassName'
		const component = mount(<CollectionMenu {...defaultProps} />)

		const menuDiv = component
			.find('.repository--module-icon--menu-wrapper')
			.children()
			.at(0)

		expect(menuDiv.prop('className')).toBe('repository--module-icon--menu mockExtraClassName')
	})

	test('"Manage Module" button click handler calls props.showCollectionManageModules', () => {
		const component = mount(<CollectionMenu {...defaultProps} />)

		component.find('Button.manage-modules').invoke('onClick')()

		expect(defaultProps.showCollectionManageModules).toHaveBeenCalledTimes(1)
		expect(defaultProps.showCollectionManageModules).toHaveBeenCalledWith(defaultProps.collection)
	})

	test('"Rename" button click handler calls props.showCollectionRename', () => {
		const component = mount(<CollectionMenu {...defaultProps} />)

		component.find('Button.rename').invoke('onClick')()

		expect(defaultProps.showCollectionRename).toHaveBeenCalledTimes(1)
		expect(defaultProps.showCollectionRename).toHaveBeenCalledWith(defaultProps.collection)
	})

	test('"Delete" button click handler creates a confirmation dialog', () => {
		const component = mount(<CollectionMenu {...defaultProps} />)

		component.find('Button.dangerous-button').invoke('onClick')()

		const confirmMsg =
			'Delete collection "Mock Collection Title"? Modules in this collection will not be deleted.'
		expect(window.confirm).toHaveBeenCalledTimes(1)
		expect(window.confirm).toHaveBeenCalledWith(confirmMsg)

		//no response from 'confirm' by default, so nothing else should happen
		expect(defaultProps.deleteCollection).not.toHaveBeenCalled()
	})

	test('confirming a delete after clicking the "Delete" button should call props.deleteCollection', () => {
		window.confirm.mockReturnValueOnce(true)

		const component = mount(<CollectionMenu {...defaultProps} />)

		component.find('Button.dangerous-button').invoke('onClick')()

		expect(defaultProps.deleteCollection).toHaveBeenCalledTimes(1)
		expect(defaultProps.deleteCollection).toHaveBeenCalledWith(defaultProps.collection)
	})
})
