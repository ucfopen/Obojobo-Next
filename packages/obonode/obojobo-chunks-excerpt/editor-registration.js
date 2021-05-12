import { Editor, Node, Element, Transforms, Text } from 'slate'
import { ReactEditor } from 'slate-react'
import Converter from './converter'
import Icon from './icon'
import KeyDownUtil from 'obojobo-document-engine/src/scripts/oboeditor/util/keydown-util'
import Line from './components/line/editor-component'
import ExcerptContent from './components/excerpt-content/editor-component'
import Citation from './components/citation/editor-component'
import EditorComponent from './editor-component'
import React from 'react'
import emptyNode from './empty-node.json'

import normalizeNode from './changes/normalize-node'
import decreaseIndent from './changes/decrease-indent'
import increaseIndent from './changes/increase-indent'
import indentOrTab from './changes/indent-or-tab'

const EXCERPT_NODE = 'ObojoboDraft.Chunks.Excerpt'
const EXCERPT_CONTENT = 'ObojoboDraft.Chunks.Excerpt.ExcerptContent'
const CITE_TEXT_NODE = 'ObojoboDraft.Chunks.Excerpt.CitationText'
const CITE_LINE_NODE = 'ObojoboDraft.Chunks.Excerpt.CitationLine'

// {
/* <Excerpt>
	<ExcerptBody>

	</ExcerptBody>
	<ExcerptCitation>

	</ExcerptCitation>
</Excerpt>

{
	type: "Excerpt",
	content: {
		body: [ {} ],
		citation: [ {} ]
	}
} */
// }

const Excerpt = {
	name: EXCERPT_NODE,
	icon: Icon,
	menuLabel: 'Box / Excerpt',
	isInsertable: true,
	isContent: true,
	helpers: Converter,
	json: {
		emptyNode
	},
	plugins: {
		// Editor Plugins - These get attached to the editor object and override it's default functions
		// They may affect multiple nodes simultaneously
		// insertData(data, editor, next) {
		// 	// Insert Slate fragments normally
		// 	if (data.types.includes('application/x-slate-fragment')) return next(data)

		// 	// If the node that we will be inserting into is not a Excerpt node use the regular logic
		// 	const [first] = Editor.nodes(editor, { match: node => Element.isElement(node) })
		// 	if (first[0].type !== EXCERPT_NODE) return next(data)

		// 	// When inserting plain text into a Excerpt node insert all lines as excerpt
		// 	const plainText = data.getData('text/plain')
		// 	const fragment = plainText.split('\n').map(text => ({
		// 		type: EXCERPT_NODE,
		// 		subtype: EXCERPT_TEXT_LINE_NODE,
		// 		content: { indent: 0, hangingIndent: false },
		// 		children: [{ text }]
		// 	}))

		// 	Transforms.insertFragment(editor, fragment)
		// },
		// normalizeNode,
		// Editable Plugins - These are used by the PageEditor component to augment React functions
		// They affect individual nodes independently of one another
		// decorate([node, path], editor) {
		// 	// Define a placeholder decoration

		// 	const placeholders = []

		// 	if (
		// 		Element.isElement(node) &&
		// 		node.subtype === EXCERPT_TEXT_LINE_NODE &&
		// 		Node.string(node) === '' &&
		// 		path[path.length - 1] === 0
		// 	) {
		// 		const point = Editor.start(editor, path)

		// 		placeholders.push({
		// 			placeholder: 'Type your excerpt here',
		// 			anchor: point,
		// 			focus: point
		// 		})
		// 	}

		// 	if (
		// 		Element.isElement(node) &&
		// 		node.subtype === CITE_LINE_NODE &&
		// 		Node.string(node) === '' &&
		// 		path[path.length - 1] === 0
		// 	) {
		// 		const point = Editor.start(editor, path)

		// 		placeholders.push({
		// 			placeholder: 'Type your optional citation here',
		// 			anchor: point,
		// 			focus: point
		// 		})
		// 	}

		// 	return placeholders
		// },
		decorate([node, path], editor) {
			if (Element.isElement(node) && Node.string(node) === '' && node.subtype === CITE_TEXT_NODE) {
				const point = Editor.start(editor, path)

				return [
					{
						placeholder: 'Type a caption or citation here',
						anchor: point,
						focus: point
					}
				]
			}

			return []
		},
		onKeyDown(entry, editor, event) {
			switch (event.key) {
				//@TODO:
				// case 'Backspace':
				// case 'Delete':
				// 	return KeyDownUtil.deleteEmptyParent(event, editor, entry, event.key === 'Delete')

				case 'Tab':
					// TAB+SHIFT
					if (event.shiftKey) return decreaseIndent(entry, editor, event)

					// TAB+ALT
					if (event.altKey) return increaseIndent(entry, editor, event)

					// TAB
					return indentOrTab(entry, editor, event)

				case 'Enter':
					return KeyDownUtil.breakToText(event, editor, entry)
			}
		},
		// renderNode(props) {
		// 	switch (props.element.subtype) {
		// 		case EXCERPT_TEXT_LINE_NODE:
		// 		case CITE_LINE_NODE:
		// 			return <Line {...props} {...props.attributes} />

		// 		case EXCERPT_TEXT_NODE:
		// 			return <Text {...props} {...props.attributes} />

		// 		case CITE_TEXT_NODE:
		// 			return <Citation {...props} {...props.attributes} />

		// 		default:
		// 			return <EditorComponent {...props} {...props.attributes} />
		// 	}
		// }
		// renderNode(props) {
		// 	console.log('render node', props, props.element.type, props.element.subtype)
		// 	// if(props.element.type === EXCERPT_NODE && !props.element.subtype)
		// 	switch (props.element.subtype) {
		// 		// case SOLUTION_NODE:
		// 		// 	return <Solution {...props} {...props.attributes} />
		// 		default:
		// 			return <EditorComponent {...props} {...props.attributes} />
		// 	}
		// }
		normalizeNode(entry, editor, next) {
			const [node, path] = entry

			// if (Element.isElement(node) && node.type === EXCERPT_NODE && !node.subtype) {
			// 	console.log('NN', node, path)
			// }

			// EXCERPT_CONTENT shouldn't have any loose text nodes:
			if (
				Element.isElement(node) &&
				node.type === EXCERPT_NODE &&
				node.subtype === EXCERPT_CONTENT
			) {
				// Wrap any loose children into TextLines (Text normalization should then turn them
				// into complete Text chunks)
				for (const [child, childPath] of Node.children(editor, path)) {
					if (Text.isText(child)) {
						return Transforms.wrapNodes(
							editor,
							{
								type: 'ObojoboDraft.Chunks.Text',
								subtype: 'ObojoboDraft.Chunks.Text.TextLine',
								content: { indent: 0 }
							},
							{ at: childPath }
						)
					}
				}
			}

			// CITE_TEXT_NODE must contain one and only one CITE_LINE_NODE
			if (
				Element.isElement(node) &&
				node.type === EXCERPT_NODE &&
				node.subtype === CITE_TEXT_NODE
			) {
				let citeLineNode = null
				const nodesToRemove = []

				for (const [child, childPath] of Node.children(editor, path)) {
					switch (child.subtype) {
						case CITE_LINE_NODE:
							if (!citeLineNode) {
								citeLineNode = child
							} else {
								nodesToRemove.push(childPath)
							}

							break

						default:
							nodesToRemove.push(childPath)
					}
				}

				if (nodesToRemove.length > 0) {
					console.log('REMOVE')
					Transforms.removeNodes(editor, { at: nodesToRemove[0] })
					return
				}

				if (!citeLineNode) {
					console.log('ADD', 'CitationLine')
					Transforms.insertNodes(
						editor,
						[
							{
								type: 'ObojoboDraft.Chunks.Excerpt',
								subtype: 'ObojoboDraft.Chunks.Excerpt.CitationLine',
								content: { indent: 0, hangingIndent: 0, align: 'center' },
								children: [{ text: '' }]
							}
						],
						{ at: path }
					)
					return
				}
			}

			// There must be one and only one EXCERPT_CONTENT and CITE_TEXT_NODE, in that order,
			// and no other types of children
			if (Element.isElement(node) && node.type === EXCERPT_NODE && !node.subtype) {
				const nodesToRemove = []
				let contentNode = null
				let citeTextNode = null

				for (const [child, childPath] of Node.children(editor, path)) {
					switch (child.subtype) {
						case EXCERPT_CONTENT:
							if (!contentNode) {
								contentNode = child
							} else {
								nodesToRemove.push(childPath)
							}
							break

						case CITE_TEXT_NODE:
							if (!citeTextNode && contentNode) {
								citeTextNode = child
							} else {
								nodesToRemove.push(childPath)
							}
							break

						default:
							nodesToRemove.push(childPath)
							break
					}
				}

				if (nodesToRemove.length > 0) {
					console.log('REMOVE2', nodesToRemove[0])
					return Transforms.removeNodes(editor, { at: nodesToRemove[0] })
				}

				if (!contentNode) {
					// Add in content nodes
					const a = { ...emptyNode.children[0] }
					console.log('ADD2', a)
					Transforms.insertNodes(editor, a, { at: path.concat(0) })
					return
				}

				if (!citeTextNode) {
					const b = { ...emptyNode.children[1] }
					console.log('ADD3', path, b, path.concat(1))
					Transforms.insertNodes(editor, b, { at: path.concat(1) })
					return
				}
			}

			next(entry, editor)
		},
		renderNode(props) {
			switch (props.element.subtype) {
				case CITE_LINE_NODE:
					return <Line {...props} {...props.attributes} />

				case CITE_TEXT_NODE:
					return <Citation {...props} {...props.attributes} />

				case EXCERPT_CONTENT:
					return <ExcerptContent {...props} {...props.attributes} />

				default:
					return <EditorComponent {...props} {...props.attributes} />
			}
		}
	}
}

/*const EXCERPT_NODE = 'ObojoboDraft.Chunks.Excerpt'
const EXCERPT_TEXT_NODE = 'ObojoboDraft.Chunks.Excerpt.ExcerptText'
const EXCERPT_TEXT_LINE_NODE = 'ObojoboDraft.Chunks.Excerpt.ExcerptLine'
const CITE_TEXT_NODE = 'ObojoboDraft.Chunks.Excerpt.CitationText'
const CITE_LINE_NODE = 'ObojoboDraft.Chunks.Excerpt.CitationLine' */

export default Excerpt
