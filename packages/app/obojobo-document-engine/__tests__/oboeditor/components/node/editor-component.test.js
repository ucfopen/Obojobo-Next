import React from 'react'
import { mount } from 'enzyme'
import rtr from 'react-test-renderer'
import { Transforms, Editor, Element, Path } from 'slate'
import { ReactEditor } from 'slate-react'
import Common from '../../../../src/scripts/common'
import Node from 'src/scripts/oboeditor/components/node/editor-component'
import InsertMenu from 'src/scripts/oboeditor/components/node/components/insert-menu'
import MoreInfoBox from 'src/scripts/oboeditor/components/navigation/more-info-box'
import isValidId from 'src/scripts/oboeditor/util/is-valid-id'

const mockNode = {
	isInsertable: true,
	icon: null,
	name: 'mockItem',
	templateObject: 'mockNode',
	insertJSON: { type: 'mockType' },
	cloneBlankNode: () => ({ type: 'mockNode' })
}

jest.mock('src/scripts/oboeditor/util/is-valid-id')
jest.mock('src/scripts/oboeditor/components/navigation/more-info-box', () =>
	global.mockReactComponent(this, 'MockMoreInfoBox')
)
jest.mock('src/scripts/oboeditor/components/node/components/insert-menu', () =>
	global.mockReactComponent(this, 'MockInsertMenu')
)
jest.mock('slate')
jest.mock('slate-react')
jest.mock('Common', () => ({
	models: {
		OboModel: {}
	},
	Registry: {
		insertableItems: [mockNode]
	}
}))

describe('Component Editor Node', () => {
	let mockProps
	let editor

	beforeEach(() => {
		jest.clearAllMocks()
		jest.useFakeTimers()
		editor = {
			toggleEditable: jest.fn()
		}

		mockProps = {
			editor: editor,
			element: {},
			contentDescription: 'mock-content-desc',
			className: 'mock-extra-classname',
			selected: false,
			children: 'mock-children'
		}

		Common.models.OboModel.models = {
			'mock-id': {
				setId: () => true
			},
			'mock-duplicate-id': {
				setId: () => false
			}
		}

		Common.models.OboModel.create = jest.fn().mockReturnValue({ setId: () => true })
	})

	test('Node builds the expected component with no classname', () => {
		const testProps = { ...mockProps, className: null }
		const component = rtr.create(<Node {...testProps} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('Node builds the expected component when not selected', () => {
		const component = rtr.create(<Node {...mockProps} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('Node builds the expected component when not selected null contentDescription', () => {
		// mock parts needed to display MoreInfoBox
		const mockParentNode = { children: [1] }
		Editor.parent.mockReturnValue([mockParentNode])
		ReactEditor.findPath.mockReturnValue([0])

		const testProps = { ...mockProps, selected: true, contentDescription: null }
		const component = rtr.create(<Node {...testProps} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('Node builds the expected component when selected', () => {
		// mock parts needed to display MoreInfoBox
		const mockParentNode = { children: [1] }
		Editor.parent.mockReturnValue([mockParentNode])
		ReactEditor.findPath.mockReturnValue([0])

		const testProps = { ...mockProps, selected: true }

		// render
		const component = rtr.create(<Node {...testProps} />)

		// verify
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('Node builds the expected component when selected when parent is a question node', () => {
		// mock parts needed to display MoreInfoBox
		const mockParentNode = { children: [1, 2, 3], type: 'ObojoboDraft.Chunks.Question' }
		Editor.parent.mockReturnValue([mockParentNode])
		ReactEditor.findPath.mockReturnValue([1])

		const testProps = { ...mockProps, selected: true }

		// render
		const component = rtr.create(<Node {...testProps} />)

		const infoBoxProps = component.root.findByType(MoreInfoBox).props

		// verify
		expect(infoBoxProps).toHaveProperty('index', 1)
		expect(infoBoxProps).toHaveProperty('isFirst', false)
		expect(infoBoxProps).toHaveProperty('isLast', true)
	})
	test('Node builds the expected component when selected when parent is a question node with solution child', () => {
		// mock parts needed to display MoreInfoBox
		const mockParentNode = {
			children: [1, 2, { type: 'ObojoboDraft.Chunks.Question' }],
			type: 'ObojoboDraft.Chunks.Question'
		}
		Editor.parent.mockReturnValue([mockParentNode])
		ReactEditor.findPath.mockReturnValue([0])

		const testProps = { ...mockProps, selected: true }

		// render
		const component = rtr.create(<Node {...testProps} />)

		const infoBoxProps = component.root.findByType(MoreInfoBox).props

		// verify
		expect(infoBoxProps).toHaveProperty('index', 0)
		expect(infoBoxProps).toHaveProperty('isFirst', true)
		expect(infoBoxProps).toHaveProperty('isLast', true)
	})

	test('Node builds the expected component when selected when parent is an assessment', () => {
		// mock parts needed to display MoreInfoBox
		const mockParentNode = { children: [1, 2, 3], type: 'ObojoboDraft.Sections.Assessment' }
		Editor.parent.mockReturnValue([mockParentNode])
		ReactEditor.findPath.mockReturnValue([1])

		const testProps = { ...mockProps, selected: true }

		// render
		const component = rtr.create(<Node {...testProps} />)

		const infoBoxProps = component.root.findByType(MoreInfoBox).props

		// verify
		expect(infoBoxProps).toHaveProperty('index', 0)
		expect(infoBoxProps).toHaveProperty('isFirst', true)
		expect(infoBoxProps).toHaveProperty('isLast', true)
	})

	test('Node component inserts node above', () => {
		// mock parts needed to display MoreInfoBox
		const mockParentNode = { children: [1] }
		Editor.parent.mockReturnValue([mockParentNode])
		Editor.start.mockReturnValue('mock-start-return')
		ReactEditor.findPath.mockReturnValue([0])

		const testProps = { ...mockProps, selected: true }

		// render
		const component = mount(<Node {...testProps} />)

		// verify that the top InsertMenu adds above
		component
			.find(InsertMenu)
			.at(0)
			.props()
			.masterOnClick(mockNode)

		expect(Transforms.insertNodes).toHaveBeenCalledWith(
			testProps.editor,
			{ type: 'mockNode' },
			{ at: [0] }
		)
		expect(Transforms.select).toHaveBeenCalledWith(testProps.editor, 'mock-start-return')
	})

	test('Node component inserts node below', () => {
		// mock parts needed to display MoreInfoBox
		const mockParentNode = { children: [1] }
		Path.next.mockReturnValue('mock-next-return')
		Editor.parent.mockReturnValue([mockParentNode])
		ReactEditor.findPath.mockReturnValue([0])

		const testProps = { ...mockProps, selected: true }

		// render
		const component = mount(<Node {...testProps} />)

		// verify that the bottom InsertMenu adds above
		component
			.find(InsertMenu)
			.at(1)
			.props()
			.masterOnClick(mockNode)

		expect(Transforms.insertNodes).toHaveBeenCalledWith(
			testProps.editor,
			{ type: 'mockNode' },
			{ at: 'mock-next-return' }
		)
		expect(Transforms.select).toHaveBeenCalledWith(testProps.editor, 'mock-start-return')
	})

	test('saveId does nothing if the old and new ids are the same', () => {
		const component = rtr.create(<Node {...mockProps} />)
		const result = component.getInstance().saveId('mock-id', 'mock-id')
		expect(result).toBe()
		expect(Transforms.setNodes).not.toHaveBeenCalled()
	})

	test('saveId does not allow duplicate nodes', () => {
		const component = rtr.create(<Node {...mockProps} />)
		isValidId.mockReturnValueOnce(true)
		const result = component.getInstance().saveId('mock-duplicate-id', 'mock-id2')
		expect(result).toBe('The id "mock-id2" already exists. Please choose a unique id.')
		expect(Transforms.setNodes).not.toHaveBeenCalled()
	})

	test('saveId does not allow an empty id', () => {
		const component = rtr.create(<Node {...mockProps} />)
		const result = component.getInstance().saveId('mock-id', '')
		expect(result).toBe('Please enter an id.')
		expect(Transforms.setNodes).not.toHaveBeenCalled()
	})

	test('saveId updates the node if ids are not the same', () => {
		ReactEditor.findPath.mockReturnValue([0]) // for getSlatePath
		const component = rtr.create(<Node {...mockProps} />)
		isValidId.mockReturnValueOnce(true)
		const result = component.getInstance().saveId('mock-id', 'mock-id2')
		expect(result).toBe()
		expect(Transforms.setNodes).toHaveBeenCalledWith(
			mockProps.editor,
			{ id: 'mock-id2' },
			{ at: [0] }
		)
	})

	test('saveId checks if the id is valid', () => {
		const component = rtr.create(<Node {...mockProps} />)
		isValidId.mockReturnValueOnce(false)
		component.getInstance().saveId('5', '5!')

		expect(isValidId).toHaveBeenCalled()
	})

	test('saveContent calls Transforms.setNodes', () => {
		const component = rtr.create(<Node {...mockProps} />)
		component.getInstance().saveContent({}, {})
		expect(Transforms.setNodes).toHaveBeenCalledWith(mockProps.editor, { content: {} }, { at: [0] })
	})

	test('deleteNode calls Transforms.removeNodes', () => {
		const component = rtr.create(<Node {...mockProps} />)
		component.getInstance().deleteNode()
		expect(Transforms.removeNodes).toHaveBeenCalled()
	})

	test('duplicateNode calls Transforms.insertNodes', () => {
		ReactEditor.findPath.mockReturnValue([0])
		const component = rtr.create(<Node {...mockProps} />)
		component.getInstance().duplicateNode()

		expect(Transforms.insertNodes).toHaveBeenCalled()
	})

	test('Node component move node down', () => {
		Path.previous.mockReturnValue('mock-previous-return')
		ReactEditor.findPath.mockReturnValue([0]) // for getSlatePath
		const component = rtr.create(<Node {...mockProps} />)
		component.getInstance().moveNode(0)

		expect(Transforms.insertNodes).toHaveBeenCalled()
		expect(Transforms.removeNodes).toHaveBeenCalled()
	})

	test('Node component move node up', () => {
		Path.next.mockReturnValue('mock-next-return')
		ReactEditor.findPath.mockReturnValue([0]) // for getSlatePath
		const component = rtr.create(<Node {...mockProps} />)
		component.getInstance().moveNode(1)

		expect(Transforms.insertNodes).toHaveBeenCalled()
		expect(Transforms.removeNodes).toHaveBeenCalled()
	})

	test('onOpen and onClose call toggleEditable', () => {
		Editor.nodes
			.mockImplementationOnce((editor, options) => {
				options.match({})
				return []
			})
			.mockImplementationOnce((editor, options) => {
				options.match({})
				return [[{ open: 'top' }, []]]
			})
			.mockImplementation((editor, options) => {
				options.match({})
				return [[{ open: 'info' }, []]]
			})
		Element.isElement.mockReturnValue(true)

		const editor = {
			toggleEditable: jest.fn()
		}

		const component = mount(
			<Node
				isSelected={true}
				node={{
					data: {
						get: () => ({ width: 'normal' }),
						toJSON: () => ({})
					},
					nodes: { size: 0 }
				}}
				editor={editor}
			/>
		)
		component.instance().onOpen()
		component.instance().onBlur('info')
		component.instance().onBlur('top')

		jest.runAllTimers()

		// Onblur with selection
		editor.selection = {}
		component.instance().onBlur('info')
		component.instance().onBlur('bottom')

		jest.runAllTimers()

		expect(editor.toggleEditable).toHaveBeenCalledTimes(4)
	})
})
