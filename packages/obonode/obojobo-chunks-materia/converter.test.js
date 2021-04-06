import Converter from './converter'

describe('Materia Converter', () => {
	test('slateToObo converts a Slate node to an OboNode with content', () => {
		const slateNode = {
			id: 'mockKey',
			type: 'mockType',
			content: {
				src: 'https://materia.ucf.edu/mock-widget',
				widgetEngine: 'Adventure',
				icon:
					'https://github.com/ucfopen/adventure-materia-widget/raw/master/src/_icons/icon-92.png',
				width: 800,
				height: 600,
				textGroup: [
					{
						text: {
							value: 'Widget Caption'
						}
					}
				]
			},
			children: [{ text: 'Widget Caption' }]
		}

		const oboNode = Converter.slateToObo(slateNode)

		expect(oboNode).toMatchSnapshot()
	})

	test('oboToSlate converts an OboNode to a Slate node', () => {
		const oboNode = {
			id: 'mockKey',
			type: 'mockType',
			content: {}
		}

		const slateNode = Converter.oboToSlate(oboNode)

		expect(slateNode).toMatchSnapshot()
	})

	test('oboToSlate converts an OboNode to a Slate node with media defaults', () => {
		const oboNode = {
			id: 'mockKey',
			type: 'mockType',
			content: {
				src: 'https://materia.ucf.edu/mock-widget',
				widgetEngine: 'Adventure',
				icon:
					'https://github.com/ucfopen/adventure-materia-widget/raw/master/src/_icons/icon-92.png',
				width: 800,
				height: 600,
				textGroup: [
					{
						text: {
							value: 'Widget Caption'
						}
					}
				]
			}
		}

		const slateNode = Converter.oboToSlate(oboNode)

		expect(slateNode).toMatchSnapshot()
	})

	test('oboToSlate converts an OboNode to a Slate node with webpage defaults', () => {
		const oboNode = {
			id: 'mockKey',
			type: 'mockType',
			content: {
				src: 'https://materia.ucf.edu/mock-widget',
				widgetEngine: 'Adventure',
				icon:
					'https://github.com/ucfopen/adventure-materia-widget/raw/master/src/_icons/icon-92.png',
				width: 800,
				height: 600,
				textGroup: [
					{
						text: {
							value: 'Widget Caption'
						}
					}
				]
			}
		}

		const slateNode = Converter.oboToSlate(oboNode)

		expect(slateNode).toMatchSnapshot()
	})
})
