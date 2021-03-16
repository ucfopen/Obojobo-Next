import Header from 'src/scripts/oboeditor/components/navigation/header'
import React from 'react'
import Common from 'src/scripts/common'
import { mount } from 'enzyme'

import EditorUtil from 'src/scripts/oboeditor/util/editor-util'
import isValidId from 'src/scripts/oboeditor/util/is-valid-id'
jest.mock('src/scripts/oboeditor/util/editor-util')
jest.mock('src/scripts/oboeditor/util/is-valid-id')

describe('Header', () => {
	beforeEach(() => {
		jest.clearAllMocks()

		Common.models.OboModel.models = {
			'5': {
				isFirst: () => true,
				isLast: () => false,
				getIndex: () => 0,
				get: jest.fn(),
				set: jest.fn(),
				setId: jest.fn(),
				getRoot: jest.fn()
			}
		}
	})

	test('Header component', () => {
		const props = {
			index: 0,
			list: [
				{
					id: '5',
					type: 'header',
					label: 'label5',
					contentType: 'Page',
					flags: {
						assessment: false
					}
				}
			]
		}
		const component = mount(<Header {...props} />)
		expect(component.html()).toMatchSnapshot()
	})

	test('renamePage handles null', () => {
		const props = {
			index: 0,
			list: [
				{
					id: '5',
					type: 'header'
				}
			]
		}
		const component = mount(<Header {...props} />)
		const result = component.instance().renamePage('page-id', 'old-title', null)

		expect(result).toBe('')
		expect(EditorUtil.renamePage).not.toHaveBeenCalled()
	})

	test('renamePage handles undefined', () => {
		const props = {
			index: 0,
			list: [
				{
					id: '5',
					type: 'header'
				}
			]
		}
		const component = mount(<Header {...props} />)
		// eslint-disable-next-line no-undefined
		const result = component.instance().renamePage('page-id', 'old-title', undefined)

		expect(result).toBe('')
		expect(EditorUtil.renamePage).not.toHaveBeenCalled()
	})

	test('renamePage trims the new title', () => {
		const props = {
			index: 0,
			list: [
				{
					id: '5',
					type: 'header'
				}
			]
		}
		const component = mount(<Header {...props} />)
		const result = component.instance().renamePage('page-id', 'old-title', '  new title  ')

		expect(result).toBe('new title')
		expect(EditorUtil.renamePage).toHaveBeenCalledWith('page-id', 'new title')
	})

	test('renamePage doesnt call renamePage if new title matches oldTitle', () => {
		const props = {
			index: 0,
			list: [
				{
					id: '5',
					type: 'header'
				}
			]
		}
		const component = mount(<Header {...props} />)
		const result = component.instance().renamePage('page-id', 'old-title', 'old-title')

		expect(result).toBe('old-title')
		expect(EditorUtil.renamePage).not.toHaveBeenCalled()
	})

	test('saveContent updates the model when the new module title is valid', () => {
		const props = {
			index: 0,
			list: [
				{
					id: '5',
					type: 'header',
					label: 'label5',
					contentType: 'Page',
					flags: {
						assessment: false
					}
				}
			]
		}
		const component = mount(<Header {...props} />)
		component.instance().saveContent({}, {})
		expect(Common.models.OboModel.models['5'].set).not.toHaveBeenCalled()

		component.instance().saveContent(
			{},
			{
				triggers: [],
				title: '     '
			}
		)
		expect(Common.models.OboModel.models['5'].set).not.toHaveBeenCalled()

		component.instance().saveContent(
			{},
			{
				title: 'Mock Title'
			}
		)
		expect(Common.models.OboModel.models['5'].set).toHaveBeenCalledTimes(1)
	})

	test('saveContent returns a message when the new module title is not a non-empty string', () => {
		const props = {
			index: 0,
			list: [
				{
					id: '5',
					type: 'header',
					label: 'label5',
					contentType: 'Page',
					flags: {
						assessment: false
					}
				}
			]
		}
		const component = mount(<Header {...props} />)

		let saveContentResponse

		saveContentResponse = component.instance().saveContent({}, {})
		expect(saveContentResponse).toBe('Module title must not be empty!')
		expect(Common.models.OboModel.models['5'].set).not.toHaveBeenCalled()

		saveContentResponse = component.instance().saveContent(
			{},
			{
				triggers: [],
				title: '     '
			}
		)
		expect(saveContentResponse).toBe('Module title must not be empty!')
		expect(Common.models.OboModel.models['5'].set).not.toHaveBeenCalled()
	})

	test('saveId updates the model', () => {
		const props = {
			index: 0,
			list: [
				{
					id: '5',
					type: 'header',
					label: 'label5',
					contentType: 'Page',
					flags: {
						assessment: false
					}
				}
			]
		}
		const component = mount(<Header {...props} />)
		Common.models.OboModel.models['5'].setId.mockReturnValueOnce(true)
		isValidId.mockReturnValueOnce(true)
		component.instance().saveId('5', 'mock-id')

		expect(EditorUtil.rebuildMenu).toHaveBeenCalled()
	})

	test('saveId does not allow an empty id', () => {
		const props = {
			index: 0,
			list: [
				{
					id: '5',
					type: 'header',
					label: 'label5',
					contentType: 'page',
					flags: {
						assessment: false
					}
				}
			]
		}
		const component = mount(<Header {...props} />)
		component.instance().saveId('5', '')

		expect(Common.models.OboModel.models['5'].setId).not.toHaveBeenCalled()
		expect(EditorUtil.rebuildMenu).not.toHaveBeenCalled()
	})

	test('saveId does not update the model', () => {
		const props = {
			index: 0,
			list: [
				{
					id: '5',
					type: 'header',
					label: 'label5',
					contentType: 'Page',
					flags: {
						assessment: false
					}
				}
			]
		}
		const component = mount(<Header {...props} />)
		isValidId.mockReturnValueOnce(true)
		Common.models.OboModel.models['5'].setId.mockReturnValueOnce(false)
		component.instance().saveId('5', 'mock-id')

		expect(EditorUtil.rebuildMenu).not.toHaveBeenCalled()
	})

	test('saveId does nothing if the old and new ids are the same', () => {
		const props = {
			index: 0,
			list: [
				{
					id: '5',
					type: 'header',
					label: 'label5',
					contentType: 'Page',
					flags: {
						assessment: false
					}
				}
			]
		}
		const component = mount(<Header {...props} />)
		component.instance().saveId('5', '5')

		expect(EditorUtil.rebuildMenu).not.toHaveBeenCalled()
	})

	test('saveId checks if the id is valid', () => {
		const props = {
			index: 0,
			list: [
				{
					id: '5',
					type: 'header',
					label: 'label5',
					contentType: 'Page',
					flags: {
						assessment: false
					}
				}
			]
		}
		const component = mount(<Header {...props} />)
		isValidId.mockReturnValueOnce(false)
		component.instance().saveId('5', '5!')

		expect(isValidId).toHaveBeenCalled()
		expect(Common.models.OboModel.models['5'].setId).not.toHaveBeenCalled()
	})
})
