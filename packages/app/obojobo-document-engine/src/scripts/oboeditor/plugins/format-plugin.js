import { Editor, Element } from 'slate'
import Common from 'obojobo-document-engine/src/scripts/common'

// const LIST_NODE = 'ObojoboDraft.Chunks.List'
const TEXT_NODE = 'ObojoboDraft.Chunks.Text'
const HEADING_NODE = 'ObojoboDraft.Chunks.Heading'
const CODE_NODE = 'ObojoboDraft.Chunks.Code'

const FormatPlugin = {
	onKeyDown(event, editor, next) {
		if (!(event.ctrlKey || event.metaKey) || !event.shiftKey) return

		switch (event.key) {
			// Using both the lower and uppercase letters to accunt for systems
			// where the shiftKey affects the key

			// Currently changing between LIST Types occurs in the list
			// onKeyDown - these cases can be uncommented when changing text to lists is permitted
			// again
			// case 'k':
			// case 'K':
			// 	event.preventDefault()
			// 	return editor.changeToType(LIST_NODE, { type: 'unordered', bulletStyle: 'disc' })
			// case 'l':
			// case 'L':
			// 	event.preventDefault()
			// 	return editor.changeToType(LIST_NODE, { type: 'ordered', bulletStyle: 'decimal' })
			case 'c':
			case 'C':
				event.preventDefault()
				return editor.changeToType(CODE_NODE)
			// Matches clear formatting commands
			case ' ':
				event.preventDefault()
				return editor.changeToType(TEXT_NODE)

			// Handle the cases where the shift key causes a change in the number
			// This happens sporadically
			// NOTE: CMD+SHIFT+3, CMD+SHIFT+4, CMD+SHIFT+5 have special meanings
			// on MasOS that cannot be overridden by event.preventDefault()
			// Mac users can use CTRL insead of CMD for those headings
			case '1':
			case '!':
				event.preventDefault()
				return editor.changeToType(HEADING_NODE, { headingLevel: 1 })
			case '2':
			case '@':
				event.preventDefault()
				return editor.changeToType(HEADING_NODE, { headingLevel: 2 })
			case '3':
			case '#':
				event.preventDefault()
				return editor.changeToType(HEADING_NODE, { headingLevel: 3 })
			case '4':
			case '$':
				event.preventDefault()
				return editor.changeToType(HEADING_NODE, { headingLevel: 4 })
			case '5':
			case '%':
				event.preventDefault()
				return editor.changeToType(HEADING_NODE, { headingLevel: 5 })
			case '6':
			case '^':
				event.preventDefault()
				return editor.changeToType(HEADING_NODE, { headingLevel: 6 })
		}
	},
	commands: {
		changeToType: (editor, type, data) => {
			const list = Array.from(
				Editor.nodes(editor, {
					mode: 'lowest',
					match: node => Element.isElement(node) && !editor.isInline(node) && !node.subtype
				})
			)

			console.log('ctt', list)

			Editor.withoutNormalizing(editor, () => {
				list.forEach(entry => {
					const item = Common.Registry.getItemForType(entry[0].type)

					if (item.switchType[type]) {
						item.switchType[type](editor, entry, data)
					}
				})
			})
		}
	}
}

export default FormatPlugin
