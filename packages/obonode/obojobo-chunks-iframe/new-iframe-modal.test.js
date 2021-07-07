import React from 'react'
import { mount } from 'enzyme'
import TestRenderer, { act } from 'react-test-renderer'
import NewIFrameModal from './new-iframe-modal'
import IFrameContentTypes from './iframe-content-types'

jest.mock('use-debounce', () => ({
	useDebouncedCallback: cb => {
		const fn = () => {
			cb()
		}

		return fn
	}
}))

const testRendererOptions = {
	createNodeMock: element => {
		if (element.type === 'input') {
			return {
				focus: () => {},
				select: () => {}
			}
		}
	}
}

describe('NewIFrameModal', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('NewIFrameModal component mounts as expected', () => {
		const component = mount(
			<NewIFrameModal
				content={{
					src: '',
					contentType: IFrameContentTypes.MEDIA
				}}
			/>
		)
		const tree = component.html()
		expect(tree).toMatchSnapshot()
	})

	test('NewIFrameModal component calls onConfirm from props', () => {
		const onConfirm = jest.fn()

		const component = mount(
			<NewIFrameModal
				content={{
					src: '',
					contentType: IFrameContentTypes.MEDIA
				}}
				onConfirm={onConfirm}
			/>
		)

		component
			.find('button')
			.at(1)
			.simulate('click')

		expect(onConfirm).toHaveBeenCalled()
	})

	test('NewIFrameModal component focuses on first element', () => {
		const component = TestRenderer.create(
			<NewIFrameModal
				content={{
					src: '',
					contentType: IFrameContentTypes.MEDIA
				}}
			/>,
			testRendererOptions
		)

		expect(component.toJSON()).toMatchSnapshot()
	})

	test('NewIFrameModal component changes src', () => {
		const component = TestRenderer.create(
			<NewIFrameModal
				content={{
					src: '',
					contentType: IFrameContentTypes.MEDIA
				}}
			/>,
			testRendererOptions
		)

		const startState = component.toJSON()
		const input = component.root.findAllByType('input')[1]
		act(() => {
			input.props.onChange({ target: { value: 'https://' } })
		})

		const endState = component.toJSON()
		expect(endState).toMatchSnapshot()
		expect(startState).not.toEqual(endState)
	})

	test('NewIFrameModal component correctly detects content type', () => {
		const component = TestRenderer.create(
			<NewIFrameModal
				content={{
					src: '',
					contentType: IFrameContentTypes.MEDIA
				}}
			/>,
			testRendererOptions
		)
		const startState = component.toJSON()
		const input = component.root.findAllByType('input')[1]

		// Changing the src input to trigger a content type detection (Detection: Media)
		act(() => {
			input.props.onChange({ target: { value: "<iframe src='https://www'></iframe>" } })
		})

		let endState = component.toJSON()
		expect(endState).toMatchSnapshot()
		expect(startState).not.toEqual(endState)

		// Changing the src input to trigger a content type detection (Detection: Webpage)
		act(() => {
			input.props.onChange({ target: { value: 'https://www' } })
		})

		endState = component.toJSON()
		expect(endState).toMatchSnapshot()
		expect(startState).not.toEqual(endState)
	})

	test('NewIFrameModal component opens section explaining why the iframe preview is not working', () => {
		const component = mount(
			<NewIFrameModal
				content={{
					src: 'https://',
					contentType: IFrameContentTypes.WEBPAGE
				}}
			/>
		)

		component
			.find('button')
			.at(0)
			.simulate('click')
		expect(component.html()).toMatchSnapshot()
	})

	test('NewIFrameModal shows message after invalid src is typed', () => {
		const component = TestRenderer.create(
			<NewIFrameModal
				content={{
					src: 'mock-src',
					contentType: IFrameContentTypes.WEBPAGE
				}}
			/>,
			testRendererOptions
		)

		const startState = component.toJSON()
		const input = component.root.findAllByType('input')[1]

		// Changing empty src input to invalid embed code or url
		act(() => {
			input.props.onChange({ target: { value: 'mock-invalid' } })
		})

		const endState = component.toJSON()
		expect(endState).toMatchSnapshot()
		expect(startState).not.toEqual(endState)
	})
})
