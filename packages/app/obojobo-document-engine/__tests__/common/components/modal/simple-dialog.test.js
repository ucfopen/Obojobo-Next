import { mount } from 'enzyme'
import React from 'react'

jest.mock('../../../../src/scripts/common/util/modal-util')

import SimpleDialog from '../../../../src/scripts/common/components/modal/simple-dialog'
import ModalUtil from '../../../../src/scripts/common/util/modal-util'
import renderer from 'react-test-renderer'

describe('SimpleDialog', () => {
	test('SimpleDialog ok', () => {
		const component = renderer.create(
			<SimpleDialog ok onCancel={jest.fn()} onConfirm={jest.fn()}>
				Content
			</SimpleDialog>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('SimpleDialog noOrYes', () => {
		const component = renderer.create(
			<SimpleDialog noOrYes onCancel={jest.fn()} onConfirm={jest.fn()}>
				Content
			</SimpleDialog>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('SimpleDialog yesOrNo', () => {
		const component = renderer.create(
			<SimpleDialog yesOrNo onCancel={jest.fn()} onConfirm={jest.fn()}>
				Content
			</SimpleDialog>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('SimpleDialog cancelOk', () => {
		const component = renderer.create(
			<SimpleDialog cancelOk onCancel={jest.fn()} onConfirm={jest.fn()}>
				Content
			</SimpleDialog>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('SimpleDialog cancelOrCustomYes', () => {
		const component = renderer.create(
			<SimpleDialog cancelOrCustomYes onCancel={jest.fn()} onConfirm={jest.fn()}>
				Content
			</SimpleDialog>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('SimpleDialog no type', () => {
		const component = renderer.create(
			<SimpleDialog onCancel={jest.fn()} onConfirm={jest.fn()}>
				Content
			</SimpleDialog>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('Other keys dont close modal', () => {
		const onConfirm = jest.fn()
		const component = mount(
			<SimpleDialog onCancel={jest.fn()} onConfirm={onConfirm}>
				Content
			</SimpleDialog>
		)

		expect(onConfirm).toHaveBeenCalledTimes(0)

		document.dispatchEvent(new KeyboardEvent('keyup', { key: 'r' }))

		expect(onConfirm).toHaveBeenCalledTimes(0)

		component.unmount()
	})

	test('SimpleDialog ok click', () => {
		const onCancel = jest.fn()
		const onConfirm = jest.fn()

		const component = mount(
			<SimpleDialog ok onCancel={onCancel} onConfirm={onConfirm}>
				Content
			</SimpleDialog>
		)

		const leftButton = component.find('button').at(0)

		leftButton.simulate('click')

		expect(onCancel).toHaveBeenCalledTimes(0)
		expect(onConfirm).toHaveBeenCalledTimes(1)
	})

	test('SimpleDialog noOrYes click', () => {
		const onCancel = jest.fn()
		const onConfirm = jest.fn()

		const component = mount(
			<SimpleDialog noOrYes onCancel={onCancel} onConfirm={onConfirm}>
				Content
			</SimpleDialog>
		)

		const leftButton = component.find('button').at(0)
		const rightButton = component.find('button').at(1)

		leftButton.simulate('click')

		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(onConfirm).toHaveBeenCalledTimes(0)

		rightButton.simulate('click')

		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(onConfirm).toHaveBeenCalledTimes(1)
	})

	test('SimpleDialog yesOrNo click', () => {
		const onCancel = jest.fn()
		const onConfirm = jest.fn()

		const component = mount(
			<SimpleDialog yesOrNo onCancel={onCancel} onConfirm={onConfirm}>
				Content
			</SimpleDialog>
		)

		const leftButton = component.find('button').at(0)
		const rightButton = component.find('button').at(1)

		leftButton.simulate('click')

		expect(onCancel).toHaveBeenCalledTimes(0)
		expect(onConfirm).toHaveBeenCalledTimes(1)

		rightButton.simulate('click')

		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(onConfirm).toHaveBeenCalledTimes(1)
	})

	test('SimpleDialog cancelOk click', () => {
		const onCancel = jest.fn()
		const onConfirm = jest.fn()

		const component = mount(
			<SimpleDialog cancelOk onCancel={onCancel} onConfirm={onConfirm}>
				Content
			</SimpleDialog>
		)

		const leftButton = component.find('button').at(0)
		const rightButton = component.find('button').at(1)

		leftButton.simulate('click')

		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(onConfirm).toHaveBeenCalledTimes(0)

		rightButton.simulate('click')

		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(onConfirm).toHaveBeenCalledTimes(1)
	})

	test('SimpleDialog cancelOk click defults', () => {
		const component = mount(<SimpleDialog cancelOk>Content</SimpleDialog>)

		const leftButton = component.find('button').at(0)
		const rightButton = component.find('button').at(1)

		leftButton.simulate('click')

		expect(ModalUtil.hide).toHaveBeenCalledTimes(1)

		rightButton.simulate('click')

		expect(ModalUtil.hide).toHaveBeenCalledTimes(2)
	})

	test('focusOnFirstElement with props', () => {
		const focusFirst = jest.fn()
		const component = mount(<SimpleDialog focusOnFirstElement={focusFirst}>Content</SimpleDialog>)

		component.instance().focusOnFirstElement()

		expect(focusFirst).toHaveBeenCalled()
	})

	test('focusOnFirstElement without props', () => {
		const component = mount(<SimpleDialog cancelOk>Content</SimpleDialog>)

		component.instance().focusOnFirstElement()

		expect(component.html()).toMatchSnapshot()
	})
})
