import { Editor, Transforms, Range } from 'slate'

const EXCERPT_LINE_NODE = 'ObojoboDraft.Chunks.Excerpt.ExcerptLine'

const indentOrTab = (entry, editor, event) => {
	event.preventDefault()
	const [, nodePath] = entry
	const nodeRange = Editor.range(editor, nodePath)
	const selectedInsideNode = Range.intersection(editor.selection, nodeRange)

	// Get only the Element children of the current node that are in the current selection
	const list = Array.from(
		Editor.nodes(editor, {
			at: selectedInsideNode,
			match: child => child.subtype === EXCERPT_LINE_NODE
		})
	)

	// If there is only one line selected and the selection is not at the start of the line
	// insert a tab instead of indenting
	if (
		Range.equals(selectedInsideNode, editor.selection) &&
		list.length === 1 &&
		editor.selection.anchor.offset !== 0 &&
		editor.selection.focus.offset !== 0
	) {
		return editor.insertText('\t')
	}

	// For each child in the selection, increment the indent without letting it get above 20
	for (const [child, path] of list) {
		Transforms.setNodes(
			editor,
			{ content: { ...child.content, indent: Math.min(child.content.indent + 1, 20) } },
			{ at: path }
		)
	}
}

export default indentOrTab
