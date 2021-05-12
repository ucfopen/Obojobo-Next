import { Editor, Transforms, Range, Path } from 'slate'

import Common from 'obojobo-document-engine/src/scripts/common'
import TextUtil from 'obojobo-document-engine/src/scripts/oboeditor/util/text-util'
import SelectionUtil from 'obojobo-document-engine/src/scripts/oboeditor/util/selection-util'
import withoutUndefined from 'obojobo-document-engine/src/scripts/common/util/without-undefined'

const EXCERPT_NODE = 'ObojoboDraft.Chunks.Excerpt'
const EXCERPT_TEXT_NODE = 'ObojoboDraft.Chunks.Excerpt.ExcerptText'
const EXCERPT_TEXT_LINE_NODE = 'ObojoboDraft.Chunks.Excerpt.ExcerptLine'
const CITE_TEXT_NODE = 'ObojoboDraft.Chunks.Excerpt.CitationText'
const CITE_LINE_NODE = 'ObojoboDraft.Chunks.Excerpt.CitationLine'
/**
 * Generates an Obojobo Excerpt Node from a Slate node.
 * Copies the id, type, triggers, and condenses ExcerptLine children and their
 * text children (including marks) into a single textGroup
 * @param {Object} node A Slate Node
 * @returns {Object} An Obojobo Excerpt node
 */
const slateToObo = node => {
	const excerptContent = node.children[0].children
	const citationText = node.children[1].children

	// const excerptTextGroup = excerptText.map(line => {
	// 	const textLine = {
	// 		text: { value: '', styleList: [] },
	// 		data: {
	// 			indent: line.content.indent,
	// 			hangingIndent: line.content.hangingIndent,
	// 			align: line.content.align
	// 		}
	// 	}

	// 	TextUtil.slateToOboText(line, textLine)

	// 	return textLine
	// })

	const citationTextGroup = citationText.map(line => {
		console.log('line be', line)

		const textLine = {
			text: { value: '', styleList: [] },
			data: {
				indent: line.content.indent,
				hangingIndent: line.content.hangingIndent,
				align: line.content.align
			}
		}

		TextUtil.slateToOboText(line, textLine)

		return textLine
	})

	console.log('slate to obo', {
		id: node.id,
		type: node.type,
		children: excerptContent.map(child =>
			Common.Registry.getItemForType(child.type).slateToObo(child)
		),
		content: withoutUndefined({
			triggers: node.content.triggers,
			citation: citationTextGroup,
			bodyStyle: node.content.bodyStyle,
			topEdge: node.content.topEdge,
			bottomEdge: node.content.bottomEdge,
			width: node.content.width,
			font: node.content.font,
			lineHeight: node.content.lineHeight,
			fontSize: node.content.fontSize,
			effect: node.content.effect
		})
	})

	return {
		id: node.id,
		type: node.type,
		children: excerptContent.map(child =>
			Common.Registry.getItemForType(child.type).slateToObo(child)
		),
		content: withoutUndefined({
			triggers: node.content.triggers,
			citation: citationTextGroup,
			bodyStyle: node.content.bodyStyle,
			topEdge: node.content.topEdge,
			bottomEdge: node.content.bottomEdge,
			width: node.content.width,
			font: node.content.font,
			lineHeight: node.content.lineHeight,
			fontSize: node.content.fontSize,
			effect: node.content.effect
		})
	}
}

/**
 * Generates a Slate node from an Obojobo Excerpt node.
 * Copies all attributes, and converts a textGroup into Slate Text children
 * Each textItem in the textgroup becomes a separate ExcerptLine node in order
 * to properly leverage the Slate Editor's capabilities
 * @param {Object} node An Obojobo Excerpt node
 * @returns {Object} A Slate node
 */
const oboToSlate = node => {
	const slateNode = Object.assign({}, node)

	slateNode.children = [
		{
			type: 'ObojoboDraft.Chunks.Excerpt',
			subtype: 'ObojoboDraft.Chunks.Excerpt.ExcerptContent',
			content: {
				...slateNode.content
			},
			children: slateNode.children.map(child =>
				Common.Registry.getItemForType(child.type).oboToSlate(child)
			)
		},
		{
			type: 'ObojoboDraft.Chunks.Excerpt',
			subtype: 'ObojoboDraft.Chunks.Excerpt.CitationText',
			content: { indent: 0, hangingIndent: 0 },
			children: node.content.citation.map(line => {
				const indent = line.data ? line.data.indent : 0
				const hangingIndent = line.data ? line.data.hangingIndent : false
				const align = line.data ? line.data.align : 'left'

				return {
					type: EXCERPT_NODE,
					subtype: CITE_LINE_NODE,
					content: { indent, hangingIndent, align },
					children: TextUtil.parseMarkings(line)
				}
			})
		}
	]

	// delete slateNode.content.excerpt
	// delete slateNode.content.citation

	console.log('oboToSlate', node, slateNode)

	return slateNode
}

export default { slateToObo, oboToSlate }
