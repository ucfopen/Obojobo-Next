import { Editor, Node, Element, Transforms, Text } from 'slate'

import NormalizeUtil from 'obojobo-document-engine/src/scripts/oboeditor/util/normalize-util'

const EXCERPT_NODE = 'ObojoboDraft.Chunks.Excerpt'
const EXCERPT_LINE_NODE = 'ObojoboDraft.Chunks.Excerpt.ExcerptLine'

// Slate runs normalizations repeatedly on a single node, so each problem can be fixed separtely
// When the normalizeNode function returns, Slate knows that a single problem within the node
// has been fixed, and runs the normalizeNode function again to see if there are any further problems
// For more detailed information, see: https://docs.slatejs.org/concepts/10-normalizing
const normalizeNode = (entry, editor, next) => {
	const [node, path] = entry

	// If the element is a Excerpt Node, only allow ExcerptLine children
	if (node.type === EXCERPT_NODE && !node.subtype) {
		// Excerpt child normalization
		for (const [child, childPath] of Node.children(editor, path)) {
			// Unwrap non-ExcerptLine children
			if (
				Element.isElement(child) &&
				!editor.isInline(child) &&
				child.subtype !== EXCERPT_LINE_NODE
			) {
				Transforms.liftNodes(editor, { at: childPath })
				return
			}

			// Wrap loose text children in a ExcerptLine
			if (Text.isText(child) || editor.isInline(child)) {
				Transforms.wrapNodes(
					editor,
					{
						type: EXCERPT_NODE,
						subtype: EXCERPT_LINE_NODE,
						content: { indent: 0 }
					},
					{ at: childPath }
				)
				return
			}
		}
	}

	// If the element is a ExcerptLine Node, make sure it has a Excerpt parent
	// and only allow text and inline children
	if (node.type === EXCERPT_NODE && node.subtype === EXCERPT_LINE_NODE) {
		// ExcerptLine children normalization
		for (const [child, childPath] of Node.children(editor, path)) {
			// Unwrap non-text and inline children
			if (Element.isElement(child) && !editor.isInline(child)) {
				Transforms.liftNodes(editor, { at: childPath })
				return
			}
		}

		// ExcerptLine parent normalization
		const [parent] = Editor.parent(editor, path)
		if (!Element.isElement(parent) || parent.type !== EXCERPT_NODE) {
			NormalizeUtil.wrapOrphanedSiblings(
				editor,
				entry,
				{ type: EXCERPT_NODE, children: [], content: {} },
				node => node.subtype === EXCERPT_LINE_NODE
			)
			return
		}
	}

	next(entry, editor)
}

export default normalizeNode
