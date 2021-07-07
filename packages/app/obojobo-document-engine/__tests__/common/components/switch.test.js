import React from 'react'
import Switch from '../../../src/scripts/common/components/switch'
import TestRenderer from 'react-test-renderer'
import { mount } from 'enzyme'

describe('Switch', () => {
	test('Switch renders correctly with no options set', () => {
		const testRenderer = TestRenderer.create(<Switch />)
		const tree = testRenderer.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('Switch renders correctly with all options set', () => {
		const testRenderer = TestRenderer.create(
			<Switch title="mocktitle" onChange={() => {}} checked={true} />
		)
		const tree = testRenderer.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('Switch renders correctly with a title', () => {
		const testRenderer = TestRenderer.create(<Switch title="mocktitle" />)
		const testInstance = testRenderer.root
		const checkbox = testInstance.findByType('span')
		expect(checkbox.children).toEqual(['mocktitle'])
	})

	test('Switch renders correctly with a description', () => {
		const testRenderer = TestRenderer.create(
			<Switch title="mocktitle" description="mockDescription" />
		)
		const testInstance = testRenderer.root
		const small = testInstance.findByType('small')
		expect(small.children).toEqual(['mockDescription'])
	})

	test('Switch renders when unchecked', () => {
		const testRenderer = TestRenderer.create(<Switch checked={false} />)
		const testInstance = testRenderer.root
		const checkbox = testInstance.findByType('input')
		expect(checkbox.props).toHaveProperty('checked', false)
	})

	test('Switch renders when checked', () => {
		const testRenderer = TestRenderer.create(<Switch checked={true} />)
		const testInstance = testRenderer.root
		const checkbox = testInstance.findByType('input')
		expect(checkbox.props).toHaveProperty('checked', true)
	})

	test('Switch calls onChange', () => {
		const onChecked = jest.fn()
		const component = mount(<Switch onChange={onChecked} />)
		const checkbox = component.find('input')
		expect(onChecked).not.toHaveBeenCalled()
		checkbox.simulate('change', { target: { checked: true } })
		expect(onChecked).toHaveBeenCalledTimes(1)
		expect(onChecked).toHaveBeenCalledWith(expect.objectContaining({ target: { checked: true } }))
	})
})
