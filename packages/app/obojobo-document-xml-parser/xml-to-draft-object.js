const convert = require('xml-js')

const nameTransform = require('./src/name-transformer')
const extensionTransform = require('./src/extension-transform')
const htmlTransform = require('./src/html-transform')
const draftJsonTransform = require('./src/draft-json-transform')
const attrElementToAttrItem = require('./src/attr-element-to-attr-item')

const parseTg = require('./src/text-group-parser')
const scoreParser = require('./src/score-action-parser')
const parseTriggers = require('./src/triggers-parser')
const parseListStyles = require('./src/list-styles-parser')
const parseAssessmentRubric = require('./src/assessment-rubric-parser')
const parseScoreAction = scoreParser.parseScoreAction
const parseScoreActions = scoreParser.parseScoreActions

const parsers = {
	textGroup: parseTg,
	scoreAction: parseScoreAction,
	scoreActions: parseScoreActions,
	rubric: parseAssessmentRubric,
	triggers: parseTriggers,
	listStyles: parseListStyles,
	solution: solAttr => {
		return solAttr.elements[0]
	}
}

const elementsToAttrElements = o => {
	for (const i in o.elements) {
		elementsToAttrElements(o.elements[i])
	}

	if (parsers[o.name]) {
		o.type = 'attribute'
		o.value = parsers[o.name](o)
		delete o.elements
	} else if (o.name && o.name.charAt(0) === o.name.charAt(0).toLowerCase()) {
		o.type = 'attribute'
		o.value = o.elements
		delete o.elements
	}
}

// @TODO: Hack
const __finalPass = o => {
	if (o.type === 'ObojoboDraft.Chunks.Table') {
		o.content.textGroup = {
			textGroup: o.content.textGroup,
			numRows: o.content.numRows,
			numCols: o.content.numCols
		}
		delete o.content.numRows
		delete o.content.numCols
	}

	for (const i in o.children) {
		__finalPass(o.children[i])
	}
}

const pattern = /^[\r\n\t ]+$/g
const filterEmptyTextOutsideOfTs = o => {
	if (o.name === 't') return
	if (o.elements) {
		o.elements = o.elements.filter(e => !(e.type === 'text' && e.text.match(pattern)))
		o.elements.forEach(e => filterEmptyTextOutsideOfTs(e))
	}
}

module.exports = (xml, generateIds = false) => {
	const root = convert.xml2js(xml, {
		compact: false,
		trim: false,
		nativeType: false,
		ignoreComment: true,
		ignoreDeclaration: true,
		captureSpacesBetweenElements: true
	})

	filterEmptyTextOutsideOfTs(root)
	nameTransform(root)
	extensionTransform(root)
	htmlTransform(root)
	elementsToAttrElements(root)
	attrElementToAttrItem(root)
	draftJsonTransform(root, generateIds)
	__finalPass(root.elements[0])
	// return root;

	return root.elements[0].children[0]
}
