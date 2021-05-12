import { Transforms } from 'slate'

import Converter from './converter'

jest.mock('obojobo-document-engine/src/scripts/oboeditor/util/text-util')

const CODE_NODE = 'ObojoboDraft.Chunks.Code'
const CODE_LINE_NODE = 'ObojoboDraft.Chunks.Code.CodeLine'
const HEADING_NODE = 'ObojoboDraft.Chunks.Heading'
const TEXT_NODE = 'ObojoboDraft.Chunks.Text'
const TEXT_LINE_NODE = 'ObojoboDraft.Chunks.Text.TextLine'
const LIST_NODE = 'ObojoboDraft.Chunks.List'
const LIST_LINE_NODE = 'ObojoboDraft.Chunks.List.Line'

describe('Code Converter', () => {
	test('slateToObo converts a Slate node to an OboNode with content', () => {
		const slateNode = {
			id: 'mockKey',
			type: 'mockType',
			content: {},
			children: [
				{
					type: 'mockCode',
					content: {},
					children: [{ text: 'mockCode', b: true }]
				}
			]
		}
		const oboNode = Converter.slateToObo(slateNode)

		expect(oboNode).toMatchSnapshot()
	})

	test('slateToObo converts a Slate node to an OboNode with triggers', () => {
		const slateNode = {
			id: 'mockKey',
			type: 'mockType',
			content: { triggers: 'mock-triggers' },
			children: [
				{
					type: 'mockCode',
					content: {},
					children: [{ text: 'mockCode', b: true }]
				}
			]
		}
		const oboNode = Converter.slateToObo(slateNode)

		expect(oboNode).toMatchSnapshot()
	})

	test('oboToSlate converts an OboNode to a Slate node', () => {
		const oboNode = {
			id: 'mockKey',
			type: 'mockType',
			content: {
				textGroup: [
					{
						data: { indent: 1 },
						text: { value: 'mockCode' }
					},
					{
						text: { value: 'mockCode2' }
					}
				],
				triggers: 'mock-triggers'
			}
		}
		const slateNode = Converter.oboToSlate(oboNode)

		expect(slateNode).toMatchSnapshot()
	})

	test('switchType[HEADING_NODE] changes leaf blocks to heading nodes', () => {
		jest.spyOn(Transforms, 'setNodes').mockReturnValueOnce(true)

		const editor = {
			children: [
				{
					id: 'mockKey',
					type: CODE_NODE,
					content: {},
					children: [
						{
							type: CODE_NODE,
							subtype: CODE_LINE_NODE,
							content: {},
							children: [{ text: 'mockCode', b: true }]
						}
					]
				}
			],
			selection: {
				anchor: { path: [0, 0, 0], offset: 1 },
				focus: { path: [0, 0, 0], offset: 1 }
			},
			isVoid: () => false
		}

		Converter.switchType[HEADING_NODE](editor, [editor.children[0], [0]], { headingLevel: 1 })

		expect(Transforms.setNodes).toHaveBeenCalledWith(
			editor,
			{ type: HEADING_NODE, content: { headingLevel: 1 }, subtype: null },
			{ at: [0, 0] }
		)
	})

	test('switchType[TEXT_NODE] changes leaf blocks to code nodes', () => {
		jest.spyOn(Transforms, 'setNodes').mockReturnValueOnce(true)

		const editor = {
			children: [
				{
					id: 'mockKey',
					type: CODE_NODE,
					content: {},
					children: [
						{
							type: CODE_NODE,
							subtype: CODE_LINE_NODE,
							content: {},
							children: [{ text: 'mockCode', b: true }]
						}
					]
				}
			],
			selection: {
				anchor: { path: [0, 0, 0], offset: 1 },
				focus: { path: [0, 0, 0], offset: 1 }
			},
			isVoid: () => false
		}

		Converter.switchType[TEXT_NODE](editor, [editor.children[0], [0]])

		expect(Transforms.setNodes).toHaveBeenCalledWith(
			editor,
			{ type: TEXT_NODE, subtype: TEXT_LINE_NODE, content: {} },
			{ at: [0, 0] }
		)
	})

	test('switchType[LIST_NODE] changes leaf blocks to ordered list nodes', () => {
		jest.spyOn(Transforms, 'removeNodes').mockReturnValueOnce(true)

		const editor = {
			children: [
				{
					id: 'mockKey',
					type: CODE_NODE,
					content: {},
					children: [
						{
							type: CODE_NODE,
							subtype: CODE_LINE_NODE,
							content: { indent: 0 },
							children: [{ text: 'mockCode', b: true }]
						}
					]
				}
			],
			selection: {
				anchor: { path: [0, 0, 0], offset: 1 },
				focus: { path: [0, 0, 0], offset: 1 }
			},
			isVoid: () => false
		}

		jest.spyOn(Transforms, 'insertNodes').mockImplementation(() => {
			// Mock the insertion of a ListLine
			editor.children[0].children[0].subtype = LIST_LINE_NODE
		})

		Converter.switchType[LIST_NODE](editor, [editor.children[0], [0]], {
			type: 'unordered',
			bulletStyle: 'disc'
		})

		expect(Transforms.removeNodes).toHaveBeenCalled()
		expect(Transforms.insertNodes).toHaveBeenCalled()
	})

	test('switchType[LIST_NODE] handles not being first or last', () => {
		jest.spyOn(Transforms, 'removeNodes').mockReturnValueOnce(true)

		const editor = {
			children: [
				{
					id: 'mockKey',
					type: CODE_NODE,
					content: {},
					children: [
						{
							type: CODE_NODE,
							subtype: CODE_LINE_NODE,
							content: { indent: 0 },
							children: [{ text: 'mockCode', b: true }]
						}
					]
				},
				{
					id: 'mockKey',
					type: CODE_NODE,
					content: {},
					children: [
						{
							type: CODE_NODE,
							subtype: CODE_LINE_NODE,
							content: { indent: 0 },
							children: [{ text: 'mockCode', b: true }]
						}
					]
				},
				{
					id: 'mockKey',
					type: CODE_NODE,
					content: {},
					children: [
						{
							type: CODE_NODE,
							subtype: CODE_LINE_NODE,
							content: { indent: 0 },
							children: [{ text: 'mockCode', b: true }]
						}
					]
				}
			],
			selection: {
				anchor: { path: [0, 0, 0], offset: 1 },
				focus: { path: [2, 0, 0], offset: 1 }
			},
			isVoid: () => false
		}

		jest.spyOn(Transforms, 'insertNodes').mockImplementation(() => {
			// Mock the insertion of a ListLine
			editor.children[0].children[0].subtype = LIST_LINE_NODE
		})

		Converter.switchType[LIST_NODE](editor, [editor.children[1], [1]], {
			type: 'unordered',
			bulletStyle: 'disc'
		})

		expect(Transforms.removeNodes).toHaveBeenCalled()
		expect(Transforms.insertNodes).toHaveBeenCalled()
	})

	test('switchType[LIST_NODE] changes leaf blocks to ordered list nodes with indent', () => {
		jest.spyOn(Transforms, 'removeNodes').mockReturnValue(true)

		const editor = {
			children: [
				{
					id: 'mockKey',
					type: CODE_NODE,
					content: {},
					children: [
						{
							type: CODE_NODE,
							subtype: CODE_LINE_NODE,
							content: { indent: 1 },
							children: [{ text: 'mockCode', b: true }]
						},
						{
							type: CODE_NODE,
							subtype: CODE_LINE_NODE,
							content: { indent: 2 },
							children: [{ text: 'mockCode', b: true }]
						},
						{
							type: CODE_NODE,
							subtype: CODE_LINE_NODE,
							content: { indent: 1 },
							children: [{ text: 'mockCode', b: true }]
						}
					]
				}
			],
			selection: {
				anchor: { path: [0, 0, 0], offset: 1 },
				focus: { path: [0, 2, 0], offset: 1 }
			},
			isVoid: () => false
		}

		jest.spyOn(Transforms, 'insertNodes').mockImplementation(() => {
			// Mock the insertion of a ListLine
			editor.children[0].children[0].subtype = LIST_LINE_NODE
			editor.children[0].children[2].subtype = LIST_LINE_NODE
		})

		Converter.switchType[LIST_NODE](editor, [editor.children[0], [0]], {
			type: 'ordered',
			bulletStyle: 'alpha'
		})

		expect(Transforms.removeNodes).toHaveBeenCalled()
		expect(Transforms.insertNodes).toHaveBeenCalled()
	})
})
