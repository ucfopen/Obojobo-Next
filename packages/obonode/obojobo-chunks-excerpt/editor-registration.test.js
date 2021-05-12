jest.mock('slate')
jest.mock('slate-react')
jest.mock('obojobo-document-engine/src/scripts/oboeditor/util/keydown-util')
jest.mock('./changes/increase-indent')
jest.mock('./changes/decrease-indent')
jest.mock('./changes/indent-or-tab')

import { Editor, Transforms, Element, Node } from 'slate'
import Code from './editor-registration'
import KeyDownUtil from 'obojobo-document-engine/src/scripts/oboeditor/util/keydown-util'
import decreaseIndent from './changes/decrease-indent'
import increaseIndent from './changes/increase-indent'
import indentOrTab from './changes/indent-or-tab'

const CODE_NODE = 'ObojoboDraft.Chunks.Code'
const CODE_LINE_NODE = 'ObojoboDraft.Chunks.Code.CodeLine'

describe('Code editor', () => {
	test('insertData calls next if pasting a Slate fragment', () => {
		const data = {
			types: ['application/x-slate-fragment']
		}
		const next = jest.fn()

		Code.plugins.insertData(data, {}, next)

		expect(next).toHaveBeenCalled()
	})

	test('insertData calls next if not pasting into Code', () => {
		const data = {
			types: ['application/html']
		}
		const next = jest.fn()
		Editor.nodes.mockImplementation((editor, { match }) => {
			match({ type: 'nonCodeNode' })
			return [[{ type: 'nonCodeNode' }]]
		})

		Code.plugins.insertData(data, {}, next)

		expect(next).toHaveBeenCalled()
	})

	test('insertData inserts all lines as CodeLines if pasting into Code', () => {
		const data = {
			types: ['application/html'],
			getData: () => 'line1 \n line2'
		}
		const next = jest.fn()
		Editor.nodes.mockReturnValueOnce([[{ type: CODE_NODE }]])

		Code.plugins.insertData(data, {}, next)

		expect(Transforms.insertFragment).toHaveBeenCalledWith({}, [
			{
				type: CODE_NODE,
				subtype: CODE_LINE_NODE,
				content: { indent: 0, hangingIndent: false },
				children: [{ text: 'line1 ' }]
			},
			{
				type: CODE_NODE,
				subtype: CODE_LINE_NODE,
				content: { indent: 0, hangingIndent: false },
				children: [{ text: ' line2' }]
			}
		])
	})

	test('plugins.renderNode renders code when passed', () => {
		const props = {
			attributes: { dummy: 'dummyData' },
			element: {
				type: CODE_NODE,
				content: {}
			}
		}

		expect(Code.plugins.renderNode(props)).toMatchSnapshot()
	})

	test('plugins.renderNode renders a line when passed', () => {
		const props = {
			attributes: { dummy: 'dummyData' },
			element: {
				type: CODE_NODE,
				subtype: CODE_LINE_NODE,
				content: {}
			}
		}

		expect(Code.plugins.renderNode(props)).toMatchSnapshot()
	})

	test('plugins.decorate exits when not relevent', () => {
		expect(Code.plugins.decorate([{ text: 'mock text' }], {})).toMatchSnapshot()

		expect(Code.plugins.decorate([{ children: [{ text: 'mock text' }] }], {})).toMatchSnapshot()
	})

	test('plugins.decorate renders a placeholder', () => {
		const editor = {
			children: [{ children: [{ text: '' }] }]
		}
		Element.isElement.mockReturnValue(true)
		Node.string.mockReturnValue('')

		expect(Code.plugins.decorate([{ children: [{ text: '' }] }, [0]], editor)).toMatchSnapshot()
	})

	test('plugins.onKeyDown deals with no special key', () => {
		const event = {
			key: 'Enter',
			preventDefault: jest.fn()
		}

		Code.plugins.onKeyDown({}, {}, event)

		expect(event.preventDefault).not.toHaveBeenCalled()
	})

	test('plugins.onKeyDown deals with [Backspace] or [Delete]', () => {
		const event1 = {
			key: 'Backspace',
			preventDefault: jest.fn()
		}

		Code.plugins.onKeyDown([{}, [0]], {}, event1)

		const event2 = {
			key: 'Delete',
			preventDefault: jest.fn()
		}

		Code.plugins.onKeyDown([{}, [0]], {}, event2)
		expect(KeyDownUtil.deleteEmptyParent).toHaveBeenCalledTimes(2)
	})

	test('plugins.onKeyDown deals with [Shift]+[Tab]', () => {
		const event = {
			key: 'Tab',
			shiftKey: true,
			preventDefault: jest.fn()
		}

		Code.plugins.onKeyDown([{}, [0]], {}, event)

		expect(decreaseIndent).toHaveBeenCalled()
	})

	test('plugins.onKeyDown deals with [Alt]+[Tab]', () => {
		const event = {
			key: 'Tab',
			altKey: true,
			preventDefault: jest.fn()
		}

		Code.plugins.onKeyDown([{}, [0]], {}, event)

		expect(increaseIndent).toHaveBeenCalled()
	})

	test('plugins.onKeyDown deals with [Tab]', () => {
		const event = {
			key: 'Tab',
			preventDefault: jest.fn()
		}

		Code.plugins.onKeyDown([{}, [0]], {}, event)

		expect(indentOrTab).toHaveBeenCalled()
	})
})
