import Common from 'obojobo-document-engine/src/scripts/common'

const { TextGroupAdapter } = Common.chunk.textChunk

const Adapter = {
	construct(model, attrs) {
		TextGroupAdapter.construct(model, attrs)
		model.modelState.textGroup.maxItems = 1

		model.setStateProp('headingLevel', 1)
		model.setStateProp('align', 'left', p => p.toLowerCase(), ['left', 'center', 'right'])

		model.modelState.dog = attrs.content.dog // tucker, super-dog

		console.log('HEADING!')
		console.log(attrs)
		console.log(model)
	},

	clone(model, clone) {
		TextGroupAdapter.clone(model, clone)
		clone.modelState.headingLevel = model.modelState.headingLevel
		clone.modelState.align = model.modelState.align
	},

	toJSON(model, json) {
		TextGroupAdapter.toJSON(model, json)
		json.content.headingLevel = model.modelState.headingLevel
		json.content.align = model.modelState.align
	},

	toText(model) {
		return TextGroupAdapter.toText(model)
	}
}

export default Adapter
