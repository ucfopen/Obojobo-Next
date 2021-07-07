import React from 'react'
import { mount } from 'enzyme'
import TestRenderer from 'react-test-renderer'
import EditIFrameModal from './edit-iframe-modal'
import IFrameSizingTypes from './iframe-sizing-types'
import IFrameContentTypes from './iframe-content-types'

// mock ref.current.focus and ref.current.select on inputs
const testRendererOptions = {
	createNodeMock: element => {
		if (element.type === 'button') {
			return {
				focus: () => {},
				select: () => {}
			}
		}
	}
}

describe('EditIframeModal', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('EditIframeModal component mounts as expected', () => {
		const component = mount(<EditIFrameModal content={{ src: '' }} />)

		const tree = component.html()
		expect(tree).toMatchSnapshot()
	})

	test('EditIframeModal component calls onConfirm from props', () => {
		const onConfirm = jest.fn()

		const component = mount(<EditIFrameModal content={{ src: '' }} onConfirm={onConfirm} />)

		component
			.find('button')
			.at(4)
			.simulate('click')
		expect(onConfirm).toHaveBeenCalled()
	})

	test('EditIframeModal component changes title', () => {
		const component = mount(<EditIFrameModal content={{ src: '' }} />)

		component
			.find('input')
			.at(7)
			.simulate('change', { target: { value: 'changed' } })
		expect(component.html()).toMatchSnapshot()
	})

	test('EditIFrameModal component changes border', () => {
		const testRenderer = TestRenderer.create(
			<EditIFrameModal content={{ src: '' }} />,
			testRendererOptions
		)

		// Opening advanced options to render special configs.
		const button = testRenderer.root.findAllByType('button')[2]
		button.props.onClick()

		// Actual testing starts here.
		const startState = testRenderer.toJSON()
		expect(startState).toMatchSnapshot()

		// Locating the switch component for the border input
		const testInstance = testRenderer.root
		const borderSwitch = testInstance.findByProps({ title: 'Border' })

		// Executing that switch's onChange
		borderSwitch.props.onChange({ target: { checked: true } })

		// Capturing the changes
		const endState = testRenderer.toJSON()

		// Comparing the snapshots
		expect(endState).toMatchSnapshot()
		expect(startState).not.toEqual(endState)
	})

	test('IFrameProperties component changes fit', () => {
		const testRenderer = TestRenderer.create(
			<EditIFrameModal content={{ src: '' }} />,
			testRendererOptions
		)

		// Opening advanced options to render special configs.
		const button = testRenderer.root.findAllByType('button')[2]
		button.props.onClick()

		// Actual testing starts here.
		const startState = testRenderer.toJSON()
		expect(startState).toMatchSnapshot()

		const testInstance = testRenderer.root

		const select = testInstance.findByProps({ id: 'select-fit' })
		select.props.onChange({ target: { value: 'changed' } })

		// Capturing the changes
		const endState = testRenderer.toJSON()

		// Comparing the snapshots
		expect(endState).toMatchSnapshot()
		expect(startState).not.toEqual(endState)
	})

	test('EditIFrameModal component changes width', () => {
		const component = mount(<EditIFrameModal content={{ src: '' }} />)

		// Opening dimensions section to render special dimension inputs.
		component
			.find('button')
			.at(1)
			.simulate('click')

		// Actual testing starts here.
		const widthInput = component.find('input').at(7)
		expect(widthInput.prop('placeholder')).toBe('--')
		expect(component.state().width).toBe(640)

		widthInput.simulate('change', { target: { value: 600 } })
		expect(component.state().width).toBe(600)
		expect(component.html()).toMatchSnapshot()
	})

	test('EditIFrameModal component changes width according to sizing option', () => {
		const component = mount(
			<EditIFrameModal
				content={{
					src: '',
					sizing: IFrameSizingTypes.TEXT_WIDTH
				}}
			/>
		)

		// Opening dimensions section to render special dimension inputs.
		component
			.find('button')
			.at(1)
			.simulate('click')

		// Actual testing starts here.
		const widthInput = component.find('input').at(7)
		expect(widthInput.prop('placeholder')).toBe('--')
		expect(widthInput.prop('value')).toBe('')

		const radio = component.find('input').at(6)
		radio.simulate('change', { target: { value: IFrameSizingTypes.FIXED } })
		expect(component.state().width).toBe(640)
	})

	test('EditIFrameModal component changes height', () => {
		const component = mount(<EditIFrameModal content={{ src: '' }} />)

		// Opening dimensions section to render special dimension inputs.
		component
			.find('button')
			.at(1)
			.simulate('click')

		// Actual testing starts here.
		const heightInput = component.find('input').at(8)
		expect(heightInput.prop('placeholder')).toBe('Height')
		expect(component.state().height).toBe(480)

		heightInput.simulate('change', { target: { value: 999 } })
		expect(component.state().height).toBe(999)
		expect(component.html()).toMatchSnapshot()
	})

	test('EditIFrameModal component changes initial zoom', () => {
		const component = mount(<EditIFrameModal content={{ src: '' }} />)

		// Opening advanced options to render special configs.
		component
			.find('button')
			.at(2)
			.simulate('click')

		// Actual testing starts here.
		const zoomInput = component.find('input').at(8)
		expect(zoomInput.prop('placeholder')).toBe('Decimal Value')
		zoomInput.simulate('change', { target: { value: 333 } })
		expect(component.html()).toMatchSnapshot()
	})

	test('EditIFrameModal component changes autoload', () => {
		const testRenderer = TestRenderer.create(
			<EditIFrameModal content={{ src: '', autoload: true }} />,
			testRendererOptions
		)

		const startState = testRenderer.toJSON()
		expect(startState).toMatchSnapshot()

		// locate the switch component for border input
		const testInstance = testRenderer.root
		const autoloadSelect = testInstance.findAllByType('select')[0]

		// execute that switch's onChange
		autoloadSelect.props.onChange({ target: { value: false } })

		// capture the changes
		const endState = testRenderer.toJSON()

		// compare the snapshots
		expect(endState).toMatchSnapshot()
		expect(startState).not.toEqual(endState)
	})

	test('EditIFrameModal component changes Reload', () => {
		const testRenderer = TestRenderer.create(
			<EditIFrameModal
				content={{
					src: ''
				}}
			/>,
			testRendererOptions
		)

		// Opening advanced options to render special configs.
		const button = testRenderer.root.findAllByType('button')[2]
		button.props.onClick()

		// Actual testing starts here.
		const startState = testRenderer.toJSON()
		expect(startState).toMatchSnapshot()

		// Locating the switch component for border input
		const testInstance = testRenderer.root
		const autoloadSwitch = testInstance.findByProps({ title: 'Reload' })

		// Executing that switch's onChange
		autoloadSwitch.props.onChange({ target: { checked: true } })
		expect(testInstance.instance.state.controls).toBe(',reload')

		// Capturing the changes
		const endState = testRenderer.toJSON()

		// Comparing the snapshots
		expect(endState).toMatchSnapshot()

		expect(startState).not.toEqual(endState)

		// Turning it back off
		autoloadSwitch.props.onChange({ target: { checked: false } })
		expect(testInstance.instance.state.controls).toBe('')
	})

	test('EditIFrameModal component changes New Window', () => {
		const testRenderer = TestRenderer.create(
			<EditIFrameModal content={{ src: '' }} />,
			testRendererOptions
		)

		// Opening advanced options to render special configs.
		const button = testRenderer.root.findAllByType('button')[2]
		button.props.onClick()

		// Actual testing starts here.
		const startState = testRenderer.toJSON()
		expect(startState).toMatchSnapshot()

		// Locating the switch component for border input
		const testInstance = testRenderer.root
		const autoloadSwitch = testInstance.findByProps({ title: 'New Window' })

		// Executing that switch's onChange
		autoloadSwitch.props.onChange({ target: { checked: true } })

		// Capturing the changes
		const endState = testRenderer.toJSON()

		// Comparing the snapshots
		expect(endState).toMatchSnapshot()
		expect(startState).not.toEqual(endState)
	})

	test('EditIFrameModal component changes Zoom', () => {
		const testRenderer = TestRenderer.create(
			<EditIFrameModal content={{ src: '' }} />,
			testRendererOptions
		)

		// Opening advanced options to render special configs.
		const button = testRenderer.root.findAllByType('button')[2]
		button.props.onClick()

		// Actual testing starts here.
		const startState = testRenderer.toJSON()
		expect(startState).toMatchSnapshot()

		// Locating the switch component for border input
		const testInstance = testRenderer.root
		const autoloadSwitch = testInstance.findByProps({ title: 'Zoom' })

		// Executing that switch's onChange
		autoloadSwitch.props.onChange({ target: { checked: true } })

		// Capturing the changes
		const endState = testRenderer.toJSON()

		// Comparing the snapshots
		expect(endState).toMatchSnapshot()
		expect(startState).not.toEqual(endState)
	})

	test('EditIFrameModal component changes sizing', () => {
		const component = mount(
			<EditIFrameModal
				content={{
					src: '',
					sizing: IFrameSizingTypes.MAX_WIDTH
				}}
			/>
		)

		component
			.find('#text-width')
			.at(0)
			.simulate('change', { target: { value: 'changed' } })
		expect(component.html()).toMatchSnapshot()
	})

	test('EditIFrameModal component changes content type', () => {
		const component = mount(
			<EditIFrameModal
				content={{
					src: '',
					contentType: IFrameContentTypes.MEDIA
				}}
			/>
		)

		component
			.find('#embedded-webpage')
			.at(0)
			.simulate('change', { target: { value: IFrameContentTypes.WEBPAGE } })
		expect(component.html()).toMatchSnapshot()
	})

	test('EditIFrameModal closes itself and goes back to NewIFrameModal', () => {
		const onCancel = jest.fn()
		const goBack = jest.fn()

		const testRenderer = TestRenderer.create(
			<EditIFrameModal content={{ src: '' }} onCancel={onCancel} goBack={goBack} />,
			testRendererOptions
		)

		const button = testRenderer.root.findAllByType('button')[0]
		button.props.onClick()

		expect(onCancel).toHaveBeenCalled()
		expect(goBack).toHaveBeenCalled()
	})
})
