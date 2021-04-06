import React from 'react'
import { mount } from 'enzyme'
import renderer from 'react-test-renderer'
import ModProperties from './mod-properties'

jest.mock('obojobo-document-engine/src/scripts/common/util/modal-util')

describe('ModProperties Modal', () => {
	test('ModProperties renders', () => {
		const component = renderer.create(
			<ModProperties
				mods={[
					{ reward: 3, attemptCondition: '$last_attempt' },
					{ reward: 3, attemptCondition: '1' },
					{ reward: -3, attemptCondition: '[1,$last_attempt' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' }
				]}
				attempts={3}
				onConfirm={jest.fn()}
			/>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('ModProperties renders with 20 mods and unlimited attempts', () => {
		const component = renderer.create(
			<ModProperties
				mods={[
					{ reward: 3, attemptCondition: '$last_attempt' },
					{ reward: 3, attemptCondition: '1' },
					{ reward: -3, attemptCondition: '[1,$last_attempt' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' },
					{ reward: -3, attemptCondition: '[$last_attempt,5]' }
				]}
				attempts={'unlimited'}
				onConfirm={jest.fn()}
			/>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('ModProperties component calls onConfirm from props', () => {
		const onConfirm = jest.fn()
		const component = mount(
			<ModProperties
				mods={[{ reward: 3, attemptCondition: '$last_attempt' }]}
				attempts={'unlimited'}
				onConfirm={onConfirm}
			/>
		)

		component
			.find('button')
			.at(5)
			.simulate('click')

		expect(onConfirm).toHaveBeenCalled()
	})

	test('ModProperties deletes Mod', () => {
		const component = mount(
			<ModProperties
				mods={[
					{ reward: 3, attemptCondition: '$last_attempt' },
					{ reward: 3, attemptCondition: '$last_attempt' }
				]}
				attempts={'unlimited'}
				onConfirm={jest.fn()}
			/>
		)

		component
			.find('button')
			.at(1)
			.simulate('click')

		expect(component.state('mods').length).toEqual(1)
	})

	test('ModProperties deletes Mod', () => {
		const component = mount(
			<ModProperties
				mods={[{ reward: 3, attemptCondition: '$last_attempt' }]}
				attempts={'unlimited'}
				onConfirm={jest.fn()}
			/>
		)

		component
			.find('button')
			.at(4)
			.simulate('click')

		expect(component.state('mods').length).toEqual(2)
	})

	test('ModProperties changes lower value', () => {
		const component = mount(
			<ModProperties
				mods={[
					{ reward: 3, attemptCondition: '$last_attempt' },
					{ reward: 3, attemptCondition: '$last_attempt' }
				]}
				attempts={'unlimited'}
				onConfirm={jest.fn()}
			/>
		)

		component
			.find('input')
			.at(1)
			.simulate('change', { target: { value: '1' } })

		expect(component.state('mods')[0].attemptCondition).toEqual('[1,$last_attempt]')
	})

	test('ModProperties changes upper value', () => {
		const component = mount(
			<ModProperties
				mods={[
					{ reward: 3, attemptCondition: '$last_attempt' },
					{ reward: 3, attemptCondition: '$last_attempt' }
				]}
				attempts={'unlimited'}
				onConfirm={jest.fn()}
			/>
		)

		component
			.find('input')
			.at(2)
			.simulate('change', { target: { value: '1' } })

		expect(component.state('mods')[0].attemptCondition).toEqual('[$last_attempt,1]')
	})

	test('ModProperties changes reward', () => {
		const component = mount(
			<ModProperties
				mods={[
					{ reward: 3, attemptCondition: '$last_attempt' },
					{ reward: 3, attemptCondition: '$last_attempt' }
				]}
				attempts={'unlimited'}
				onConfirm={jest.fn()}
			/>
		)

		component
			.find('input')
			.at(3)
			.simulate('change', { target: { value: 1 } })

		expect(component.state('mods')[0].reward).toEqual(1)
	})

	test('ImageProperties component focuses on first element', () => {
		const component = mount(
			<ModProperties
				mods={[{ reward: 3, attemptCondition: '$last_attempt' }]}
				attempts={'unlimited'}
				onConfirm={jest.fn()}
			/>
		)

		component.instance().focusOnFirstElement()
		expect(component.html()).toMatchSnapshot()
	})

	test('ImageProperties changes Slider', () => {
		const component = mount(
			<ModProperties
				mods={[{ reward: 3, attemptCondition: '$last_attempt' }]}
				attempts={'unlimited'}
				onConfirm={jest.fn()}
			/>
		)

		component.instance().onChangeSlider(0, [1, 2])
		expect(component.html()).toMatchSnapshot()
	})
})
