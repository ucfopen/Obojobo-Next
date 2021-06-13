/* eslint-disable no-undefined */

import AssessmentRubric from '../../assessment-rubric'

const RUBRIC_NODE = 'ObojoboDraft.Sections.Assessment.Rubric'

const slateToObo = node => {
	const content = Object.assign({}, node.content)
	delete content.showModProperties

	if (content.type !== AssessmentRubric.TYPE_PASS_FAIL) return ''

	if (content.passedType !== AssessmentRubric.SET_VALUE) content.passedResult = content.passedType
	if (content.failedType !== AssessmentRubric.SET_VALUE) content.failedResult = content.failedType
	if (content.unableToPassType !== AssessmentRubric.SET_VALUE) {
		content.unableToPassResult = content.unableToPassType
	}
	if (content.unableToPassResult === AssessmentRubric.NO_VALUE) content.unableToPassResult = null
	if (content.mods && content.mods.length < 1) delete content.mods

	delete content.passedType
	delete content.failedType
	delete content.unableToPassType
	delete content.attempts

	return content
}

const oboToSlate = node => {
	if (node.passedResult === AssessmentRubric.VAR_ATTEMPT_SCORE) {
		node.passedType = AssessmentRubric.VAR_ATTEMPT_SCORE
		node.passedResult = 100
	} else {
		node.passedType = AssessmentRubric.SET_VALUE
	}

	switch (node.failedResult) {
		case AssessmentRubric.VAR_ATTEMPT_SCORE:
			node.failedType = AssessmentRubric.VAR_ATTEMPT_SCORE
			node.failedResult = 0
			break
		case AssessmentRubric.NO_SCORE:
			node.failedType = AssessmentRubric.NO_SCORE
			node.failedResult = 0
			break
		default:
			node.failedType = AssessmentRubric.SET_VALUE
			break
	}

	switch (node.unableToPassResult) {
		case AssessmentRubric.VAR_HIGHEST_ATTEMPT_SCORE:
			node.unableToPassType = AssessmentRubric.VAR_HIGHEST_ATTEMPT_SCORE
			node.unableToPassResult = 0
			break
		case AssessmentRubric.NO_SCORE:
			node.unableToPassType = AssessmentRubric.NO_SCORE
			node.unableToPassResult = 0
			break
		case null:
		case undefined:
			node.unableToPassType = AssessmentRubric.NO_VALUE
			node.unableToPassResult = 0
			break
		default:
			node.unableToPassType = AssessmentRubric.SET_VALUE
			break
	}

	if (!node.mods) node.mods = []

	return {
		type: RUBRIC_NODE,
		content: node,
		children: [{ text: '' }]
	}
}

export default { slateToObo, oboToSlate }
