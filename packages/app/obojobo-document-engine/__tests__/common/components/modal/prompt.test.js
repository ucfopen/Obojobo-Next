import React from 'react'
import { mount } from 'enzyme'

import Prompt from 'src/scripts/common/components/modal/prompt'

describe('Prompt Modal', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('Prompt component', () => {
		const component = mount(<Prompt />)
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('Prompt component calls onConfirm from props', () => {
		const onConfirm = jest.fn()

		const component = mount(<Prompt onConfirm={onConfirm} />)

		component
			.find('button')
			.at(2)
			.simulate('click')

		expect(onConfirm).toHaveBeenCalled()
	})

	test('Prompt component focuses on first element', () => {
		const component = mount(<Prompt content={{}} />)

		component.instance().focusOnFirstElement()

		expect(component.html()).toMatchSnapshot()
	})

	test('Prompt component changes value', () => {
		const onConfirm = jest.fn()

		const component = mount(<Prompt onConfirm={onConfirm} />)

		component
			.find('input')
			.at(1)
			.simulate('change', { target: { value: 'changed' } })

		expect(component.html()).toMatchSnapshot()
	})

	test('Prompt component deals with keydown', () => {
		const onConfirm = jest.fn()

		const component = mount(<Prompt onConfirm={onConfirm} />)

		component
			.find('input')
			.at(1)
			.simulate('keyDown', { key: 'R' })

		expect(onConfirm).not.toHaveBeenCalled()

		component
			.find('input')
			.at(1)
			.simulate('keyDown', { key: 'Enter' })

		expect(onConfirm).toHaveBeenCalled()
	})
})
