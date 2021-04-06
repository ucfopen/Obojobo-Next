import TextUtil from 'obojobo-document-engine/src/scripts/oboeditor/util/text-util'
import withoutUndefined from 'obojobo-document-engine/src/scripts/common/util/without-undefined'

/**
 * Generates an Obojobo Materia from a Slate node.
 * Copies the id, type, and triggers.  The conversion also saves the
 * src, widgetEngine, icon, width, and height
 * @param {Object} node A Slate Node
 * @returns {Object} An Obojobo Materia node
 */
const slateToObo = node => {
	const captionLine = {
		text: { value: '', styleList: [] },
		data: null
	}
	TextUtil.slateToOboText(node, captionLine)

	return {
		id: node.id,
		type: node.type,
		children: [],
		content: withoutUndefined({
			triggers: node.content.triggers,
			textGroup: [captionLine],
			src: node.content.src,
			widgetEngine: node.content.widgetEngine,
			icon: node.content.icon,
			width: node.content.width,
			height: node.content.height
		})
	}
}

/**
 * Generates a Slate node from an Obojobo Materia. Copies all attributes, and adds a dummy child
 * @param {Object} node An Obojobo Materia node
 * @returns {Object} A Slate node
 */
const oboToSlate = node => {
	const slateNode = Object.assign({}, node)

	slateNode.children = node.content.textGroup
		? node.content.textGroup.flatMap(line => TextUtil.parseMarkings(line)) // convert obojobo text to Slate
		: [{ text: '' }] // default caption object

	return slateNode
}

export default { slateToObo, oboToSlate }
