import numericChoicesToScoreRuleConfigs from './numeric-choices-to-score-rule-configs'

const Adapter = {
	construct(model, attrs) {
		const children = attrs && attrs.children ? attrs.children : []

		model.modelState.scoreRules = numericChoicesToScoreRuleConfigs(children || [])
	},

	clone(model, clone) {
		clone.modelState.scoreRules = { ...model.modelState.scoreRules }
	}
}

export default Adapter
