import { mount, shallow } from 'enzyme'
import React from 'react'

import Switch from '../../../../src/scripts/common/components/switch'
import TriggerListModal from '../../../../src/scripts/oboeditor/components/triggers/trigger-list-modal'

describe('TriggerListModal', () => {
	test('renders all options', () => {
		const content = {
			triggers: [
				{
					type: 'onMount',
					actions: [
						{ type: 'nav:goto', value: {} },
						{ type: 'nav:openExternalLink', value: {} },
						{ type: 'assessment:startAttempt', value: {} },
						{ type: 'assessment:endAttempt', value: {} },
						{ type: 'viewer:alert', value: {} },
						{ type: 'viewer:scrollToTop', value: {} },
						{ type: 'focus:component', value: {} },
						{ type: 'nav:prev', value: {} }
					]
				}
			]
		}
		const component = shallow(<TriggerListModal content={content} />)
		const tree = component.html()
		expect(tree).toMatchSnapshot()
	})

	test('renders if given no triggers', () => {
		const component = shallow(<TriggerListModal content={{}} />)
		const tree = component.html()
		expect(tree).toMatchSnapshot()
	})

	test('deletes trigger', () => {
		const content = {
			triggers: [
				{
					type: 'onMount',
					actions: [{ type: 'nav:goto', value: {} }]
				},
				{
					type: 'onUnmount',
					actions: []
				}
			]
		}
		const component = shallow(<TriggerListModal content={content} />)

		component
			.find('button')
			.at(0)
			.simulate('click')

		const tree = component.html()
		expect(tree).toMatchSnapshot()
	})

	test('deletes an action', () => {
		const content = {
			triggers: [
				{
					type: 'onMount',
					actions: [{ type: 'nav:goto', value: {} }, { type: 'nav:prev', value: {} }]
				},
				{
					type: 'onUnmount',
					actions: []
				}
			]
		}
		const component = shallow(<TriggerListModal content={content} />)

		component
			.find('button')
			.at(2)
			.simulate('click')

		const tree = component.html()
		expect(tree).toMatchSnapshot()
	})

	test('adds an action', () => {
		const content = {
			triggers: [
				{
					type: 'onMount',
					actions: [{ type: 'nav:goto', value: {} }]
				},
				{
					type: 'onUnmount',
					actions: []
				}
			]
		}
		const component = mount(<TriggerListModal content={content} />)

		component
			.find('button')
			.at(4)
			.simulate('click')

		const tree = component.html()
		expect(tree).toMatchSnapshot()
	})

	test('adds a trigger', () => {
		const content = {
			triggers: [
				{
					type: 'onMount',
					actions: [{ type: 'nav:goto', value: {} }]
				},
				{
					type: 'onUnmount',
					actions: []
				}
			]
		}
		const component = mount(<TriggerListModal content={content} />)

		component
			.find('button')
			.at(7)
			.simulate('click')

		const tree = component.html()
		expect(tree).toMatchSnapshot()
	})

	test('node closes', () => {
		const content = {
			triggers: [
				{
					type: 'onMount',
					actions: [{ type: 'nav:goto', value: {} }]
				},
				{
					type: 'onUnmount',
					actions: []
				}
			]
		}
		const close = jest.fn()
		const component = mount(<TriggerListModal content={content} onClose={close} />)

		component
			.find('button')
			.at(8)
			.simulate('click')

		expect(close).toHaveBeenCalled()
	})

	test('calls close on unmount', () => {
		const content = { triggers: [] }
		const close = jest.fn()
		const component = mount(<TriggerListModal content={content} onClose={close} />)

		expect(close).not.toHaveBeenCalled()
		component.unmount()
		expect(close).toHaveBeenCalledWith()
	})

	test('unounts when there is no close prop', () => {
		const content = { triggers: [] }
		const component = mount(<TriggerListModal content={content} />)

		expect(function() {
			component.unmount()
		}).not.toThrow()
	})

	test('changes trigger', () => {
		const content = {
			triggers: [
				{
					type: 'onMount',
					actions: [{ type: 'nav:goto', value: {} }]
				},
				{
					type: 'onUnmount',
					actions: []
				}
			]
		}
		const component = mount(<TriggerListModal content={content} />)

		component
			.find('select')
			.at(0)
			.simulate('change', {
				target: { value: 'onNavEnter' }
			})

		const tree = component.html()
		expect(tree).toMatchSnapshot()
	})

	test('changes action type', () => {
		const content = {
			triggers: [
				{
					type: 'onMount',
					actions: [{ type: 'nav:goto', value: {} }, { type: 'nav:next', value: {} }]
				},
				{
					type: 'onUnmount',
					actions: []
				}
			]
		}
		const component = mount(<TriggerListModal content={content} />)

		component
			.find('select')
			.at(1)
			.simulate('change', {
				target: { value: 'nav:prev' }
			})

		const tree = component.html()
		expect(tree).toMatchSnapshot()
	})

	test('changes action value', () => {
		const content = {
			triggers: [
				{
					type: 'onMount',
					actions: [{ type: 'nav:goto', value: { id: 1 } }, { type: 'nav:goto', value: { id: 2 } }]
				},
				{
					type: 'onUnmount',
					actions: []
				}
			]
		}
		const component = mount(<TriggerListModal content={content} />)

		// make sure this is the expected label/input combo
		const inputLabel = component.find('label').at(2)
		expect(inputLabel.props().children).toBe('Item Id')

		// change the value
		component
			.find('input')
			.at(2)
			.simulate('change', { target: { type: 'text', value: '10' } })

		// check that the value changed
		expect(
			component
				.find('input')
				.at(2)
				.props()
		).toHaveProperty('value', '10')

		// check the change to state
		expect(component.state()).toHaveProperty('triggers')
		expect(component.state().triggers[0].actions).toContainEqual({
			type: 'nav:goto',
			value: { id: '10' }
		})

		// check the rendered component
		const tree = component.html()
		expect(tree).toMatchSnapshot()
	})

	test('changes scroll type', () => {
		const content = {
			triggers: [
				{
					type: 'onMount',
					actions: [
						{ type: 'focus:component', value: { id: 1 } },
						{ type: 'focus:component', value: { id: 1 } }
					]
				},
				{
					type: 'onUnmount',
					actions: []
				}
			]
		}
		const component = mount(<TriggerListModal content={content} />)

		component
			.find('select')
			.at(2)
			.simulate('change', {
				target: { value: 'animateScroll' }
			})
		expect(component.state().triggers[0].actions[0].value).toHaveProperty('animateScroll', true)
		expect(component.state().triggers[0].actions[0].value).toHaveProperty('preventScroll', false)

		component
			.find('select')
			.at(2)
			.simulate('change', {
				target: { value: 'preventScroll' }
			})
		expect(component.state().triggers[0].actions[0].value).toHaveProperty('animateScroll', false)
		expect(component.state().triggers[0].actions[0].value).toHaveProperty('preventScroll', true)

		component
			.find('select')
			.at(2)
			.simulate('change', {
				target: { value: 'jumpScroll' }
			})
		expect(component.state().triggers[0].actions[0].value).toHaveProperty('animateScroll', false)
		expect(component.state().triggers[0].actions[0].value).toHaveProperty('preventScroll', false)
	})

	test('updateActionValue using a switch/checkbox', () => {
		const content = {
			triggers: [
				{
					type: 'onMount',
					actions: [{ type: 'focus:component', value: { fade: false } }]
				},
				{
					type: 'onUnmount',
					actions: []
				}
			]
		}
		const component = mount(<TriggerListModal content={content} />)
		const input = component.find(Switch).find('input')
		input.simulate('change', { target: { type: 'checkbox', checked: true } })
		expect(component.state().triggers[0].actions[0].value).toHaveProperty('fade', true)

		input.simulate('change', { target: { type: 'checkbox', checked: false } })
		expect(component.state().triggers[0].actions[0].value).toHaveProperty('fade', false)
	})

	test('getScrollType returns correct value', () => {
		const action = {
			value: {
				animateScroll: false,
				preventScroll: false
			}
		}

		expect(TriggerListModal.prototype.getScrollType(action)).toBe('jumpScroll')

		action.value.preventScroll = true
		expect(TriggerListModal.prototype.getScrollType(action)).toBe('preventScroll')

		action.value.animateScroll = true
		expect(TriggerListModal.prototype.getScrollType(action)).toBe('animateScroll')
		action.value.preventScroll = false
		expect(TriggerListModal.prototype.getScrollType(action)).toBe('animateScroll')
	})

	test.each`
		type
		${'nav:goto'}
		${'nav:prev'}
		${'nav:next'}
		${'nav:openExternalLink'}
		${'nav:lock'}
		${'nav:unlock'}
		${'nav:open'}
		${'nav:close'}
		${'nav:toggle'}
		${'assessment:startAttempt'}
		${'assessment:endAttempt'}
		${'viewer:alert'}
		${'viewer:scrollToTop'}
		${'focus:component'}
	`(
		'createNewDefaultActionValueObject($type) creates a new default action value object',
		({ type }) => {
			expect(TriggerListModal.prototype.createNewDefaultActionValueObject(type)).toMatchSnapshot()
		}
	)
})
