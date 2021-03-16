import React from 'react'
import { mount } from 'enzyme'
import renderer from 'react-test-renderer'
import YouTube from './editor-component'
import { Transforms } from 'slate'
import ModalUtil from 'obojobo-document-engine/src/scripts/common/util/modal-util'

jest.mock('obojobo-document-engine/src/scripts/common/util/modal-util')
jest.mock('obojobo-document-engine/src/scripts/common/util/insert-dom-tag', () => () => {
	// simulate loading the youtube iframe api
	global.window.onYouTubeIframeAPIReady()
})
jest.mock('slate')
jest.mock('slate-react')
jest.mock(
	'obojobo-document-engine/src/scripts/oboeditor/components/node/with-slate-wrapper',
	() => item => item
)
jest.mock(
	'obojobo-document-engine/src/scripts/oboeditor/components/node/editor-component',
	() => props => <div>{props.children}</div>
)
jest.mock('obojobo-document-engine/src/scripts/common/util/uuid', () => () => 'mockId')

describe('YouTube Editor Node', () => {
	beforeEach(() => {
		jest.restoreAllMocks()
		jest.resetAllMocks()
	})

	test('YouTube component', () => {
		const component = renderer.create(<YouTube element={{ content: { videoId: 'gJ390e5sjHk' } }} />)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('YouTube renders with no id correctly', () => {
		const component = renderer.create(<YouTube element={{ content: {} }} />)
		expect(component.toJSON()).toMatchSnapshot()
	})

	test('YouTube component handles tab', () => {
		const component = mount(<YouTube element={{ content: { videoId: 'gJ390e5sjHk' } }} selected />)

		component
			.find('button')
			.at(0)
			.simulate('keyDown', { key: 'k' })
		component
			.find('button')
			.at(0)
			.simulate('keyDown', { key: 'Tab', shiftKey: true })

		component
			.find('button')
			.at(1)
			.simulate('keyDown', { key: 'k' })
		component
			.find('button')
			.at(1)
			.simulate('keyDown', { key: 'Tab' })

		const tree = component.html()
		expect(tree).toMatchInlineSnapshot(
			`"<div><div contenteditable=\\"false\\" class=\\"obojobo-draft--chunks--you-tube viewer pad  is-selected\\"><div class=\\"obojobo-draft--components--button is-not-dangerous align-center delete-button\\" contenteditable=\\"false\\"><button class=\\"button\\" contenteditable=\\"false\\">×</button></div><div id=\\"obojobo-draft--chunks-you-tube-player-mockId\\" class=\\"obojobo-draft--chunks-you-tube-player\\"></div><div class=\\"obojobo-draft--components--button is-not-dangerous align-center edit-button\\" contenteditable=\\"false\\"><button class=\\"button\\" tabindex=\\"0\\" contenteditable=\\"false\\">Edit</button></div></div></div>"`
		)
	})

	test('YouTube component deletes self', () => {
		const component = mount(<YouTube element={{ content: { videoId: 'gJ390e5sjHk' } }} />)

		component
			.find('button')
			.at(0)
			.simulate('click')

		expect(Transforms.removeNodes).toHaveBeenCalled()
	})

	test('YouTube component edits properties', () => {
		const component = mount(<YouTube element={{ content: { videoId: 'gJ390e5sjHk' } }} />)

		component
			.find('button')
			.at(1)
			.simulate('click')

		expect(ModalUtil.show).toHaveBeenCalled()
	})

	test('changeProperties sets the nodes content', () => {
		const component = mount(<YouTube element={{ content: { videoId: 'gJ390e5sjHk' } }} />)

		component.instance().handleSourceChange({ mockProperties: 'mock value' })

		expect(Transforms.setNodes).toHaveBeenCalled()
	})
})
