import { Editor, Transforms, Range, Path } from 'slate'

import TextUtil from 'obojobo-document-engine/src/scripts/oboeditor/util/text-util'
import SelectionUtil from 'obojobo-document-engine/src/scripts/oboeditor/util/selection-util'
import withoutUndefined from 'obojobo-document-engine/src/scripts/common/util/without-undefined'

const TEXT_NODE = 'ObojoboDraft.Chunks.Text'
const TEXT_LINE_NODE = 'ObojoboDraft.Chunks.Text.TextLine'
const HEADING_NODE = 'ObojoboDraft.Chunks.Heading'
const LIST_NODE = 'ObojoboDraft.Chunks.List'
const LIST_LEVEL_NODE = 'ObojoboDraft.Chunks.List.Level'
const LIST_LINE_NODE = 'ObojoboDraft.Chunks.List.Line'
const CODE_NODE = 'ObojoboDraft.Chunks.Code'
const CODE_LINE_NODE = 'ObojoboDraft.Chunks.Code.CodeLine'

const unorderedBullets = ['disc', 'circle', 'square']
const orderedBullets = ['decimal', 'lower-alpha', 'lower-roman', 'upper-alpha', 'upper-roman']

/**
 * Generates an Obojobo Text Node from a Slate node.
 * Copies the id, type, triggers, and condenses TextLine children and their
 * text children (including marks) into a single textGroup
 * @param {Object} node A Slate Node
 * @returns {Object} An Obojobo Text node
 */
const slateToObo = node => {
	const textGroup = node.children.map(line => {
		const textLine = {
			text: { value: '', styleList: [] },
			data: withoutUndefined({
				indent: line.content.indent,
				align: line.content.align,
				hangingIndent: line.content.hangingIndent
			})
		}

		TextUtil.slateToOboText(line, textLine)

		return textLine
	})

	return {
		id: node.id,
		type: node.type,
		children: [],
		content: withoutUndefined({
			triggers: node.content.triggers,
			textGroup
		})
	}
}

/**
 * Generates a Slate node from an Obojobo Text node.
 * Copies all attributes, and converts a textGroup into Slate Text children
 * Each textItem in the textgroup becomes a separate TextLine node in order
 * to properly leverage the Slate Editor's capabilities
 * @param {Object} node An Obojobo Text node
 * @returns {Object} A Slate node
 */
const oboToSlate = node => {
	const slateNode = Object.assign({}, node)
	slateNode.children = node.content.textGroup.map(line => {
		const indent = line.data ? line.data.indent : 0
		const hangingIndent = line.data ? line.data.hangingIndent : false
		const align = line.data ? line.data.align : 'left'

		return {
			type: TEXT_NODE,
			subtype: TEXT_LINE_NODE,
			content: { indent, align, hangingIndent },
			children: TextUtil.parseMarkings(line)
		}
	})

	return slateNode
}

// Provides a single node with recursively nested parent levels with appropriate bullets
const unFlattenList = (jsonNode, diff, type, bulletList, bulletIndex) => {
	if (diff === 0) return jsonNode

	// The parent bullet style is the style before the current style
	const bulletStyle = bulletList[(bulletIndex + diff - 1) % bulletList.length]

	return unFlattenList(
		{
			type: LIST_NODE,
			subtype: LIST_LEVEL_NODE,
			children: [jsonNode],
			content: { type, bulletStyle }
		},
		diff - 1,
		type,
		bulletList,
		bulletIndex
	)
}

const switchType = {
	'ObojoboDraft.Chunks.Heading': (editor, [, path], data) => {
		// console.log('ctt TEXT TO HEADIN')
		const nodeRange = Editor.range(editor, path)
		// Get only the Element children of the current node that are in the current selection
		const list = Array.from(
			Editor.nodes(editor, {
				at: Range.intersection(editor.selection, nodeRange),
				match: child => child.subtype === TEXT_LINE_NODE
			})
		)

		// console.log('ctt list', list)

		Editor.withoutNormalizing(editor, () => {
			list.forEach(([child, childPath]) => {
				// console.log('ctt child', child, childPath)
				Transforms.setNodes(
					editor,
					{ type: HEADING_NODE, content: { ...child.content, ...data }, subtype: null },
					{ at: childPath }
				)
			})
		})
	},
	'ObojoboDraft.Chunks.Code': (editor, [, path]) => {
		const nodeRange = Editor.range(editor, path)
		const list = Array.from(
			Editor.nodes(editor, {
				at: Range.intersection(editor.selection, nodeRange),
				match: child => child.subtype === TEXT_LINE_NODE
			})
		)

		// Changing each CodeLine to a TextLine will allow normalization
		// to remove them from the Code node and wrap them in a Text node
		Editor.withoutNormalizing(editor, () => {
			list.forEach(([child, childPath]) =>
				Transforms.setNodes(
					editor,
					{ type: CODE_NODE, subtype: CODE_LINE_NODE, content: { ...child.content } },
					{ at: childPath }
				)
			)
		})
	},
	'ObojoboDraft.Chunks.List': (editor, [, path], data) => {
		// Find the bullet list and starting index for the selection
		const bulletList = data.type === 'unordered' ? unorderedBullets : orderedBullets
		const bulletIndex = bulletList.indexOf(data.bulletStyle)

		const nodeRange = Editor.range(editor, path)
		const [start, end] = Range.edges(editor.selection)
		const containsStart = Range.includes(nodeRange, start)
		const containsEnd = Range.includes(nodeRange, end)

		const list = Array.from(
			Editor.nodes(editor, {
				at: Range.intersection(editor.selection, nodeRange),
				match: child => child.subtype === TEXT_LINE_NODE
			})
		)

		const topIndent = list.reduce((accum, [child]) => {
			if (child.content.indent < accum) return child.content.indent
			return accum
		}, 20)

		// Changing each TextLine to a ListLevel will allow normalization
		// to remove them from the Text node and wrap them in a List node
		// Indents in the TextLine are transfered into nested Levels
		const startPath = list[0][1]
		let endPath = list[0][1]
		Editor.withoutNormalizing(editor, () => {
			list.forEach(([child, childPath]) => {
				// Save the start and end child paths to fix the selection once all nodes are moved
				if (Path.isAfter(childPath, endPath)) endPath = childPath

				Transforms.removeNodes(editor, { at: childPath })
				// Use the topmost indent as the starting bullet style
				// then rotate through the bullet styles as the indents increase
				const indentDiff = child.content.indent - topIndent
				const bulletStyle = bulletList[(bulletIndex + indentDiff) % bulletList.length]

				const jsonNode = {
					type: LIST_NODE,
					subtype: LIST_LEVEL_NODE,
					content: {
						type: data.type,
						bulletStyle
					},
					children: [
						{
							type: LIST_NODE,
							subtype: LIST_LINE_NODE,
							content: child.content,
							children: child.children
						}
					]
				}

				Transforms.insertNodes(
					editor,
					unFlattenList(jsonNode, indentDiff, data.type, bulletList, bulletIndex),
					{ at: childPath }
				)
			})

			if (containsStart) {
				SelectionUtil.resetPointAtUncertainDepth(
					editor,
					path,
					start,
					startPath,
					LIST_LINE_NODE,
					'anchor'
				)
			}

			if (containsEnd) {
				SelectionUtil.resetPointAtUncertainDepth(
					editor,
					path,
					end,
					endPath,
					LIST_LINE_NODE,
					'focus'
				)
			}
		})
	}
}

export default { slateToObo, oboToSlate, switchType }
