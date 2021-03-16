import React from 'react'
import { mount } from 'enzyme'
import renderer from 'react-test-renderer'

import Common from '../../../../src/scripts/common'
import EditorUtil from '../../../../src/scripts/oboeditor/util/editor-util'
import isValidId from '../../../../src/scripts/oboeditor/util/is-valid-id'
import {
	getTriggersWithActionsAdded,
	getTriggersWithActionsRemoved,
	hasTriggerTypeWithActionType
} from '../../../../src/scripts/common/util/trigger-util'
import SubMenu from '../../../../src/scripts/oboeditor/components/navigation/sub-menu'

jest.mock('../../../../src/scripts/oboeditor/util/editor-util', () => ({
	renamePage: jest.fn(),
	movePage: jest.fn(),
	addPage: jest.fn(),
	rebuildMenu: jest.fn(),
	deletePage: jest.fn()
}))

jest.mock('../../../../src/scripts/common', () => ({
	models: {
		OboModel: {}
	},
	components: {
		modal: {
			Dialog: () => <div>Dialog</div>, //eslint-disable-line react/display-name
			Prompt: () => <div>Prompt</div> //eslint-disable-line react/display-name
		}
	},
	util: {
		ModalUtil: {
			hide: jest.fn(),
			show: jest.fn()
		},
		TriggerUtil: {
			hasTriggerTypeWithActionType: jest.fn()
		}
	},
	Registry: {
		getItems: funct => {
			return funct({
				values: () => [
					{
						isInsertable: true,
						icon: null,
						name: 'mockItem',
						templateObject: 'mockNode',
						cloneBlankNode: () => ({ type: 'mockNode' })
					}
				]
			})
		}
	}
}))

jest.mock('../../../../src/scripts/oboeditor/util/editor-util')
jest.mock('../../../../src/scripts/oboeditor/util/is-valid-id')
jest.mock('../../../../src/scripts/common/util/trigger-util')
jest.mock('../../../../src/scripts/oboeditor/stores/editor-store', () => ({
	state: { startingId: null }
}))
jest.mock('../../../../src/scripts/oboeditor/components/navigation/more-info-box', () => props => (
	<div mockname="MockMoreInfoBox">{JSON.stringify(props, null, 2)}</div>
))

jest.useFakeTimers()

describe('SubMenu', () => {
	beforeEach(() => {
		jest.clearAllMocks()

		const mockGet = key => {
			switch (key) {
				case 'type':
					return 'mock-type'
				case 'content':
					return 'mock-content'
			}
		}

		Common.models.OboModel.models = {
			'5': {
				isFirst: () => true,
				isLast: () => false,
				getIndex: () => 0,
				get: mockGet
			},
			'6': {
				isFirst: () => false,
				isLast: () => true,
				getIndex: () => 1,
				get: mockGet
			},
			'7': {
				isFirst: () => false,
				isLast: () => false,
				getIndex: () => 2,
				get: mockGet,
				setId: jest.fn(),
				set: jest.fn(),
				clone: () => ({ toJSON: () => ({}) })
			}
		}

		Common.models.OboModel.getRoot = jest.fn()
	})

	test('SubMenu component', () => {
		const itemList = [
			{
				id: 5,
				type: 'link',
				label: 'label5',
				contentType: 'Page',
				flags: {
					assessment: false
				}
			}
		]
		const component = renderer.create(<SubMenu index={0} isSelected={false} list={itemList} />)

		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('SubMenu component selected as assessment', () => {
		const itemList = [
			{
				id: 6,
				type: 'link',
				label: 'label6',
				flags: {
					assessment: true
				}
			}
		]
		const component = renderer.create(<SubMenu index={0} isSelected={true} list={itemList} />)

		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('SubMenu component adds page', () => {
		const itemList = [
			{
				id: 5,
				type: 'link',
				label: 'label5',
				contentType: 'Page',
				flags: {
					assessment: false
				}
			}
		]
		const component = mount(<SubMenu index={0} isSelected={true} list={itemList} />)

		const addPageButton = component.find({ className: 'add-page-button' })
		addPageButton.simulate('click')

		expect(component.html()).toMatchSnapshot()
	})

	test('SubMenu component calls parent onClick function', () => {
		const itemList = [
			{
				id: 6,
				type: 'link',
				label: 'label6',
				flags: {
					assessment: false
				}
			}
		]
		const parentOnClick = jest.fn()
		const component = mount(
			<SubMenu index={0} isSelected={true} list={itemList} onClick={parentOnClick} />
		)

		component
			.find('button') // [Link, Move Up, Move Down, Edit Name, Set Start, Delete, ID]
			.at(0)
			.simulate('click')

		expect(parentOnClick).toHaveBeenCalled()
	})

	test('renamePage edits page name with empty label', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]
		const parentOnClick = jest.fn()
		const component = mount(
			<SubMenu index={0} isSelected={true} list={itemList} onClick={parentOnClick} />
		)

		component.instance().renamePage(7, '  ')

		expect(EditorUtil.renamePage).toHaveBeenCalled()
	})

	test('renamePage edits page name', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]
		const parentOnClick = jest.fn()
		const component = mount(
			<SubMenu index={0} isSelected={true} list={itemList} onClick={parentOnClick} />
		)

		component.instance().renamePage(7, 'mock title')

		expect(EditorUtil.renamePage).toHaveBeenCalled()
	})

	test('deletePage calls EditorUtil', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]

		const component = mount(<SubMenu index={0} list={itemList} />)

		component.instance().deletePage()

		expect(EditorUtil.deletePage).toHaveBeenCalled()
	})

	test('movePage calls EditorUtil', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]

		const component = mount(<SubMenu index={0} list={itemList} />)

		component.instance().movePage()

		expect(EditorUtil.movePage).toHaveBeenCalled()
	})

	test('addPage calls EditorUtil', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]

		const component = mount(<SubMenu index={0} list={itemList} updateNavTargetId={jest.fn()} />)

		component.instance().addPage()
		expect(EditorUtil.addPage).toHaveBeenCalledWith(
			expect.objectContaining({
				content: expect.objectContaining({
					title: null
				})
			}),
			7
		)

		component.instance().addPage('New Title')
		expect(EditorUtil.addPage).toHaveBeenCalledWith(
			expect.objectContaining({
				content: expect.objectContaining({
					title: 'New Title'
				})
			}),
			7
		)

		component.instance().addPage('     ')
		expect(EditorUtil.addPage).toHaveBeenCalledWith(
			expect.objectContaining({
				content: expect.objectContaining({
					title: null
				})
			}),
			7
		)
	})

	test('saveId sends error with bad id', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]

		const component = mount(<SubMenu index={0} list={itemList} updateNavTargetId={jest.fn()} />)
		isValidId.mockReturnValue(true)

		component.instance().saveId('7', 'mock-id')
		expect(EditorUtil.rebuildMenu).not.toHaveBeenCalled()

		component.instance().saveId('7', '')
		expect(EditorUtil.rebuildMenu).not.toHaveBeenCalled()
	})

	test('saveId calls rebuildMenu with good id', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]
		Common.models.OboModel.models['7'].setId.mockReturnValueOnce(true)
		isValidId.mockReturnValueOnce(true)

		const component = mount(<SubMenu index={0} list={itemList} updateNavTargetId={jest.fn()} />)

		component.instance().saveId('7', 'mock-id')
		expect(EditorUtil.rebuildMenu).toHaveBeenCalled()
	})

	test('saveId checks if the id is valid', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]
		const component = mount(<SubMenu index={0} list={itemList} updateNavTargetId={jest.fn()} />)
		Common.models.OboModel.models['7'].setId = jest.fn()
		isValidId.mockReturnValueOnce(false)
		component.instance().saveId('7', '7!')

		expect(isValidId).toHaveBeenCalled()
		expect(Common.models.OboModel.models['7'].setId).not.toHaveBeenCalled()
	})

	test('saveContent updates model', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]
		Common.models.OboModel.models['7'].setId.mockReturnValueOnce(true)

		const component = mount(<SubMenu index={0} list={itemList} updateNavTargetId={jest.fn()} />)

		component.instance().saveContent({}, {})
		expect(Common.models.OboModel.models['7']).toMatchSnapshot()

		component.instance().saveContent({}, { triggers: [], title: 'Mock title' })
		expect(Common.models.OboModel.models['7']).toMatchSnapshot()
	})

	test('showDeleteModal calls show', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]

		const component = mount(<SubMenu index={0} list={itemList} updateNavTargetId={jest.fn()} />)

		component.instance().showDeleteModal()
		expect(Common.util.ModalUtil.show).toHaveBeenCalled()
	})

	test('duplicatePage calls addPage', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]

		const component = mount(<SubMenu index={0} list={itemList} savePage={jest.fn()} />)

		component.instance().duplicatePage()
		expect(EditorUtil.addPage).toHaveBeenCalled()
	})

	test('lockValue returns true', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]

		const component = mount(<SubMenu index={0} list={itemList} savePage={jest.fn()} />)

		hasTriggerTypeWithActionType.mockReturnValue(true)

		expect(component.instance().lockValue({})).toEqual(true)
	})

	test('onChangeLock calls getTriggersWithActionsAdded', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]

		const component = mount(<SubMenu index={0} list={itemList} savePage={jest.fn()} />)

		component.instance().onChangeLock({}, true)
		expect(getTriggersWithActionsAdded).toHaveBeenCalled()
	})

	test('onChangeLock calls getTriggersWithActionsRemoved', () => {
		const itemList = [
			{
				id: 7,
				type: 'link',
				label: 'label7',
				flags: {
					assessment: false
				}
			}
		]

		const component = mount(<SubMenu index={0} list={itemList} savePage={jest.fn()} />)
		component.instance().onChangeLock({}, false)
		expect(getTriggersWithActionsRemoved).not.toHaveBeenCalled()

		component.instance().onChangeLock({ triggers: [] }, false)
		expect(getTriggersWithActionsRemoved).toHaveBeenCalled()
	})
})
