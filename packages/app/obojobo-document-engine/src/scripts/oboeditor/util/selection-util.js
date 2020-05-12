import { Editor, Transforms, Point, Range } from 'slate'

const SelectionUtil = {
	/**
	 * Reset a selection point when changing between nodes of different depths
	 * This is promarily used when converting to and from lists, as the nested levels
	 * cause the selection to be lost
	 * 
	 * @param {Object} editor A Slate editor
	 * @param {Array} path The path to the Obojobo node
	 * @param {Object} point The original point that needs to be reset
	 * @param {Array} leafPath The path to the leaf-most Element that contained the point (a child of path before conversion)
	 * @param {String} leafSubtype The subtype of the leaf-most node that the new point will be inside
	 * @param {start | anchor | end | focus} edge Which selection point is being set
	 */

	resetPointAtUncertainDepth(editor, path, point, leafPath, leafSubtype, edge) {
		// Since the depth is uncertian, we use the given path to find any matching children
		// If we are resetting the start || anchor, we want the first node
		// Otherwise (resetting end or focus), we want the last node
		const [foundNode] = Array.from(
			Editor.nodes(editor, {
				at: path,
				match: n => n.subtype === leafSubtype,
				reverse: edge === 'end' || edge ==='focus'
			})
		)

		// The difference between startPath and start Point indicates what inline
		// and what text leaf is currently selected
		const leafDepth = point.path.length - leafPath.length
		const relativeLeafPath = point.path.slice(point.path.length - leafDepth)

		// Therefore, the point to focus on is
		// the line's path
		// + the relative leaf path
		// + the original offset
		Transforms.setPoint(
			editor,
			{
				path: foundNode[1].concat(relativeLeafPath),
				offset: point.offset
			},
			{ edge }
		)
	},

	moveSelectionOutsideNode(editor, path) {
		const selection = editor.selection || editor.prevSelection
		const nodeRange = Editor.range(editor, path)

		// If the current selection is not in the node, don't do anything
		if(!Range.intersection(selection, nodeRange)) return

		// If the start point is before the qb, move the selection to before the qb
		const nodeStart = Range.start(nodeRange)
		const selectionStart = Range.start(selection)
		const before = Editor.before(editor, nodeStart)
		if(Point.isBefore(selectionStart, nodeStart)) {
			return Transforms.setSelection(
				editor, 
				{ 
					anchor: selectionStart,
					focus: before,
				}
			)
		}

		// If the start point is after the qb, move the selection to after the qb
		const nodeEnd = Range.end(nodeRange)
		const selectionEnd = Range.end(selection)
		const after = Editor.after(editor, nodeEnd)
		if(Point.isAfter(selectionEnd, nodeEnd)) {
			return Transforms.setSelection(
				editor, 
				{ 
					anchor: after,
					focus: selectionEnd
				}
			)
		}
		// Otherwise, try to move the selection to before the qb
		// If a point before the question bank exists, move to it
		if(before) {
			return Transforms.setSelection(
				editor, 
				{ 
					anchor: before,
					focus: before
				}
			)
		}

		// If a point after the question bank exists, move to it
		if(after) {
			return Transforms.setSelection(
				editor, 
				{ 
					anchor: after,
					focus: after
				}
			)
		}

		// If no before and after points exist, de-focus the editor
		Transforms.deselect(editor)
	}
}

export default SelectionUtil