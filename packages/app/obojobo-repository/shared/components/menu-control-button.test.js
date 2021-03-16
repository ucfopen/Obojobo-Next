import React from 'react'
import MenuControlButton from './menu-control-button'
import { create } from 'react-test-renderer'

describe('MenuControlButton', () => {
	test('renders with no additional classes', () => {
		const component = create(<MenuControlButton />)

		expect(component.root.findAllByProps({ className: ' menu-control-button' }).length).toBe(1)
		expect(
			component.root.findAllByProps({ className: 'other-class menu-control-button' }).length
		).toBe(0)

		expect(component.toJSON()).toMatchSnapshot()
	})

	test('renders with additional classes', () => {
		const component = create(<MenuControlButton className="other-class" />)

		expect(component.root.findAllByProps({ className: ' menu-control-button' }).length).toBe(0)
		expect(
			component.root.findAllByProps({ className: 'other-class menu-control-button' }).length
		).toBe(1)

		expect(component.toJSON()).toMatchSnapshot()
	})
})
