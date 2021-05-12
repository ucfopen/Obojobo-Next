import { Transforms } from 'slate'
jest.mock('slate-react')
import NormalizeUtil from 'obojobo-document-engine/src/scripts/oboeditor/util/normalize-util'
jest.mock('obojobo-document-engine/src/scripts/oboeditor/util/normalize-util')

import normalizeNode from './normalize-node'

const CODE_NODE = 'ObojoboDraft.Chunks.Code'
const CODE_LINE_NODE = 'ObojoboDraft.Chunks.Code.CodeLine'

describe('Normalize Code', () => {
	test('normalizeNode calls next if the node is not a Code node', () => {
		const next = jest.fn()
		normalizeNode([{}, []], {}, next)

		expect(next).toHaveBeenCalled()
	})

	test('normalizeNode on Code calls next if all Code children are valid', () => {
		const next = jest.fn()
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
						}
					]
				}
			],
			isInline: () => false
		}
		normalizeNode([editor.children[0], [0]], editor, next)

		expect(next).toHaveBeenCalled()
	})

	test('normalizeNode on Code calls Transforms on invalid Element children', () => {
		jest.spyOn(Transforms, 'liftNodes').mockReturnValueOnce(true)

		const next = jest.fn()
		const editor = {
			children: [
				{
					id: 'mockKey',
					type: CODE_NODE,
					content: {},
					children: [
						{
							type: CODE_NODE,
							subtype: 'improperNode',
							content: { indent: 1 },
							children: [{ text: 'mockCode', b: true }]
						}
					]
				}
			],
			isInline: () => false
		}
		normalizeNode([editor.children[0], [0]], editor, next)

		expect(Transforms.liftNodes).toHaveBeenCalled()
	})

	test('normalizeNode on Code calls Transforms on invalid Text children', () => {
		jest.spyOn(Transforms, 'wrapNodes').mockReturnValueOnce(true)

		const next = jest.fn()
		const editor = {
			children: [
				{
					id: 'mockKey',
					type: CODE_NODE,
					content: {},
					children: [{ text: 'mockCode', b: true }]
				}
			],
			isInline: () => false
		}
		normalizeNode([editor.children[0], [0]], editor, next)

		expect(Transforms.wrapNodes).toHaveBeenCalled()
	})

	test('normalizeNode on CodeLine calls next if all CodeLine children are valid', () => {
		const next = jest.fn()
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
						}
					]
				}
			],
			isInline: () => false
		}
		normalizeNode([editor.children[0].children[0], [0, 0]], editor, next)

		expect(next).toHaveBeenCalled()
	})

	test('normalizeNode on CodeLine calls Transforms on invalid Element children', () => {
		jest.spyOn(Transforms, 'liftNodes').mockReturnValueOnce(true)

		const next = jest.fn()
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
							children: [
								{
									type: 'invalidNode',
									children: [{ text: 'mockCode', b: true }]
								}
							]
						}
					]
				}
			],
			isInline: () => false
		}
		normalizeNode([editor.children[0].children[0], [0, 0]], editor, next)

		expect(Transforms.liftNodes).toHaveBeenCalled()
	})

	test('normalizeNode on CodeLine calls NormalizeUtil if parent is invalid', () => {
		const next = jest.fn()
		const editor = {
			children: [
				{
					id: 'mockKey',
					type: 'invalidNode',
					content: {},
					children: [
						{
							type: CODE_NODE,
							subtype: CODE_LINE_NODE,
							content: { indent: 1 },
							children: [{ text: 'mockCode', b: true }]
						}
					]
				}
			],
			isInline: () => false
		}
		NormalizeUtil.wrapOrphanedSiblings.mockImplementation((editor, entry, wrapper, match) => {
			match(editor.children[0].children[0])
		})

		normalizeNode([editor.children[0].children[0], [0, 0]], editor, next)

		expect(NormalizeUtil.wrapOrphanedSiblings).toHaveBeenCalled()
	})
})
