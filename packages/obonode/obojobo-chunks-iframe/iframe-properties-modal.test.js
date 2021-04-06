import React from 'react'
import { mount } from 'enzyme'
import TestRenderer from 'react-test-renderer'
import IFrameProperties from './iframe-properties-modal'
import IFrameSizingTypes from './iframe-sizing-types'

// mock ref.current.focus and ref.current.select on inputs
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

describe('IFrame Properties Modal', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('IFrameProperties component', () => {
		const component = mount(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>
		)
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('IFrameProperties component calls onConfirm from props', () => {
		const onConfirm = jest.fn()

		const component = mount(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
				onConfirm={onConfirm}
			/>
		)

		component
			.find('button')
			.at(2)
			.simulate('click')

		expect(onConfirm).toHaveBeenCalled()
	})

	test('IFrameProperties component focuses on first element', () => {
		const component = mount(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>
		)

		component.instance().focusOnFirstElement()

		expect(component.html()).toMatchSnapshot()
	})

	test('IFrameProperties component changes title', () => {
		const component = mount(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>
		)

		component
			.find('input')
			.at(1)
			.simulate('change', { target: { value: 'changed' } })

		expect(component.html()).toMatchSnapshot()
	})

	test('IFrameProperties component changes src', () => {
		const component = mount(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>
		)

		component
			.find('input')
			.at(2)
			.simulate('change', { target: { value: 'changed' } })

		expect(component.html()).toMatchSnapshot()
	})

	test('IFrameProperties component changes border', () => {
		const testRenderer = TestRenderer.create(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>,
			testRendererOptions
		)

		const startState = testRenderer.toJSON()
		expect(startState).toMatchSnapshot()

		// locate the switch component for border input
		const testInstance = testRenderer.root
		const borderSwitch = testInstance.findByProps({ title: 'Border' })

		// execute that switch's onChange
		borderSwitch.props.onChange({ target: { checked: true } })

		// capture the changes
		const endState = testRenderer.toJSON()

		// compare the snapshots
		expect(endState).toMatchSnapshot()

		expect(startState).not.toEqual(endState)
	})

	test('IFrameProperties component changes fit', () => {
		const component = mount(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>
		)

		component
			.find('#obojobo-draft--chunks--iframe--properties-modal--fit')
			.at(0)
			.simulate('change', { target: { value: 'changed' } })

		expect(component.html()).toMatchSnapshot()
	})

	test('IFrameProperties component changes width', () => {
		const component = mount(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>
		)

		const widthInput = component.find('input').at(3)
		expect(widthInput.prop('placeholder')).toBe('Width')
		expect(component.state().width).toBe(640)

		widthInput.simulate('change', { target: { value: 600 } })
		expect(component.state().width).toBe(600)
		expect(component.html()).toMatchSnapshot()
	})

	test('IFrameProperties component changes width according to sizing option', () => {
		const component = mount(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1,
					sizing: IFrameSizingTypes.TEXT_WIDTH
				}}
			/>
		)

		const widthInput = component.find('input').at(3)
		expect(widthInput.prop('placeholder')).toBe('--')
		expect(widthInput.prop('value')).toBe('')

		const select = component.find('select').at(0)
		select.simulate('change', { target: { value: IFrameSizingTypes.FIXED } })
		expect(component.state().width).toBe(640)
		// expect(widthInput.prop('placeholder')).toBe('Width')
	})

	test('IFrameProperties component changes height', () => {
		const component = mount(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>
		)

		const heightInput = component.find('input').at(4)
		expect(heightInput.prop('placeholder')).toBe('Height')
		expect(component.state().height).toBe(480)

		heightInput.simulate('change', { target: { value: 999 } })
		expect(component.state().height).toBe(999)
		expect(component.html()).toMatchSnapshot()
	})

	// @TODO: fragile, relies on input ordering and difficult to read snapshot html dump
	test('IFrameProperties component changes initial zoom', () => {
		const component = mount(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>
		)

		const zoomInput = component.find('input').at(7)
		expect(zoomInput.prop('placeholder')).toBe('Decimal Value')
		zoomInput.simulate('change', { target: { value: 333 } })
		expect(component.html()).toMatchSnapshot()
	})

	test('IFrameProperties component changes autoload', () => {
		const testRenderer = TestRenderer.create(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>,
			testRendererOptions
		)

		const startState = testRenderer.toJSON()
		expect(startState).toMatchSnapshot()

		// locate the switch component for border input
		const testInstance = testRenderer.root
		const autoloadSwitch = testInstance.findByProps({ title: 'Autoload' })

		// execute that switch's onChange
		autoloadSwitch.props.onChange({ target: { checked: true } })

		// capture the changes
		const endState = testRenderer.toJSON()

		// compare the snapshots
		expect(endState).toMatchSnapshot()

		expect(startState).not.toEqual(endState)
	})

	test('IFrameProperties component changes Reload', () => {
		const testRenderer = TestRenderer.create(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>,
			testRendererOptions
		)

		const startState = testRenderer.toJSON()
		expect(startState).toMatchSnapshot()

		// locate the switch component for border input
		const testInstance = testRenderer.root
		const autoloadSwitch = testInstance.findByProps({ title: 'Reload' })

		// execute that switch's onChange
		autoloadSwitch.props.onChange({ target: { checked: true } })
		expect(testInstance.instance.state.controls).toBe(',reload')

		// capture the changes
		const endState = testRenderer.toJSON()

		// compare the snapshots
		expect(endState).toMatchSnapshot()

		expect(startState).not.toEqual(endState)

		// turn it back off
		autoloadSwitch.props.onChange({ target: { checked: false } })
		expect(testInstance.instance.state.controls).toBe('')
	})

	test('IFrameProperties component changes New Window', () => {
		const testRenderer = TestRenderer.create(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>,
			testRendererOptions
		)

		const startState = testRenderer.toJSON()
		expect(startState).toMatchSnapshot()

		// locate the switch component for border input
		const testInstance = testRenderer.root
		const autoloadSwitch = testInstance.findByProps({ title: 'New Window' })

		// execute that switch's onChange
		autoloadSwitch.props.onChange({ target: { checked: true } })

		// capture the changes
		const endState = testRenderer.toJSON()

		// compare the snapshots
		expect(endState).toMatchSnapshot()

		expect(startState).not.toEqual(endState)
	})

	test('IFrameProperties component changes Zoom', () => {
		const testRenderer = TestRenderer.create(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>,
			testRendererOptions
		)

		const startState = testRenderer.toJSON()
		expect(startState).toMatchSnapshot()

		// locate the switch component for border input
		const testInstance = testRenderer.root
		const autoloadSwitch = testInstance.findByProps({ title: 'Zoom' })

		// execute that switch's onChange
		autoloadSwitch.props.onChange({ target: { checked: true } })

		// capture the changes
		const endState = testRenderer.toJSON()

		// compare the snapshots
		expect(endState).toMatchSnapshot()

		expect(startState).not.toEqual(endState)
	})

	test('IFrameProperties component changes sizing', () => {
		const component = mount(
			<IFrameProperties
				content={{
					controls: '',
					border: false,
					initialZoom: 1
				}}
			/>
		)

		component
			.find('#obojobo-draft--chunks--iframe--properties-model--sizing')
			.at(0)
			.simulate('change', { target: { value: 'changed' } })

		expect(component.html()).toMatchSnapshot()
	})
})
