import { Editor, Transforms, Range } from 'slate'

const EXCERPT_LINE_NODE = 'ObojoboDraft.Chunks.Excerpt.ExcerptLine'

const decreaseIndent = (entry, editor, event) => {
	event.preventDefault()
	const [, nodePath] = entry
	const nodeRange = Editor.range(editor, nodePath)

	// Get only the Element children of the current node that are in the current selection
	const list = Array.from(
		Editor.nodes(editor, {
			at: Range.intersection(editor.selection, nodeRange),
			match: child => child.subtype === EXCERPT_LINE_NODE
		})
	)

	// For each child in the selection, decrement the indent without letting it drop below 0
	for (const [child, path] of list) {
		Transforms.setNodes(
			editor,
			{ content: { ...child.content, indent: Math.max(child.content.indent - 1, 0) } },
			{ at: path }
		)
	}
}

export default decreaseIndent
