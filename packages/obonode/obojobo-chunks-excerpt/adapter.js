import Common from 'obojobo-document-engine/src/scripts/common'

const { TextGroup } = Common.textGroup

const adapter = {
	construct(model, attrs) {
		if (attrs && attrs.content && attrs.content.excerpt) {
			model.modelState.excerpt = TextGroup.fromDescriptor(attrs.content.excerpt, Infinity, {
				indent: 0,
				hangingIndent: false,
				align: 'left'
			})
		} else {
			model.modelState.excerpt = TextGroup.create(Infinity, {
				indent: 0,
				hangingIndent: false,
				align: 'left'
			})
		}

		if (attrs && attrs.content && attrs.content.citation) {
			model.modelState.citation = TextGroup.fromDescriptor(attrs.content.citation, Infinity, {
				indent: 0,
				hangingIndent: false,
				align: 'left'
			})
		} else {
			model.modelState.citation = TextGroup.create(Infinity, {
				indent: 0,
				hangingIndent: false,
				align: 'left'
			})
		}

		model.setStateProp('preset', 'simple-filled', p => p.toLowerCase(), [
			'simple-filled',
			'simple-bordered',
			'card',
			'fiction',
			'non-fiction',
			'historical',
			'poem',
			'white-paper',
			'instruction-manual',
			'typewritten',
			'receipt',
			'computer-modern',
			'computer-hacker-white',
			'computer-hacker-green',
			'computer-hacker-orange',
			'computer-c64',
			'modern-text-file',
			'retro-text-file'
		])

		model.setStateProp('bodyStyle', 'filled-box', p => p.toLowerCase(), [
			'filled-box',
			'bordered-box',
			'card',
			'white-paper',
			'modern-paper',
			'light-yellow-paper',
			'dark-yellow-paper',
			'aged-paper',
			'modern-book-page',
			'old-book-page',
			'command-line',
			'term-white',
			'term-green',
			'term-orange',
			'term-c64',
			'retro-text-file',
			'modern-text-file',
			'none'
		])

		model.setStateProp('font', 'serif', p => p.toLowerCase(), [
			'serif',
			'sans',
			'monospace',
			'times-new-roman',
			'georgia',
			'helvetica',
			'courier',
			'palatino'
		])

		model.setStateProp('topEdge', 'normal', p => p.toLowerCase(), ['normal', 'fade', 'jagged'])

		model.setStateProp('bottomEdge', 'normal', p => p.toLowerCase(), ['normal', 'fade', 'jagged'])

		model.setStateProp('width', 'medium', p => p.toLowerCase(), [
			'large',
			'medium',
			'small',
			'tiny'
		])

		model.setStateProp('lineHeight', 'moderate', p => p.toLowerCase(), [
			'compact',
			'moderate',
			'generous'
		])

		model.setStateProp('fontSize', 'regular', p => p.toLowerCase(), [
			'smaller',
			'regular',
			'larger'
		])

		model.setStateProp('effect', false, Boolean)
	},

	clone(model, clone) {
		clone.modelState.excerpt = model.modelState.excerpt.clone()
		clone.modelState.citation = model.modelState.citation.clone()
	},

	toJSON(model, json) {
		json.content.excerpt = model.modelState.excerpt.toDescriptor()
		json.content.citation = model.modelState.citation.toDescriptor()
	}
}

export default adapter
