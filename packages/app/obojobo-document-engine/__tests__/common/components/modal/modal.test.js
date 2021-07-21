import Modal from '../../../../src/scripts/common/components/modal/modal'
import ModalUtil from '../../../../src/scripts/common/util/modal-util'
import React from 'react'
import { mount } from 'enzyme'
import renderer from 'react-test-renderer'

jest.mock('../../../../src/scripts/common/util/modal-util')

describe('Modal', () => {
	let onClose, focusOnFirstElement

	beforeEach(() => {
		onClose = jest.fn()
		focusOnFirstElement = jest.fn()
		jest.resetAllMocks()
	})

	test('Modal', () => {
		const props = {
			onClose,
			focusOnFirstElement,
			className: 'mockClassName'
		}

		const component = renderer.create(<Modal {...props}>Content</Modal>)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('Modal close button closes the modal', () => {
		const component = mount(
			<Modal onClose={onClose} focusOnFirstElement={focusOnFirstElement}>
				Content
			</Modal>
		)

		expect(onClose).toHaveBeenCalledTimes(0)

		component
			.find('DeleteButton')
			.find('button')
			.simulate('click')

		expect(onClose).toHaveBeenCalledTimes(1)

		component.unmount()
	})

	test('Esc closes modal', () => {
		const component = mount(
			<Modal onClose={onClose} focusOnFirstElement={focusOnFirstElement}>
				Content
			</Modal>
		)

		expect(onClose).toHaveBeenCalledTimes(0)

		document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 27 }))

		expect(onClose).toHaveBeenCalledTimes(1)
		expect(ModalUtil.hide).toHaveBeenCalledTimes(2)

		component.unmount()
	})

	test('Esc closes modal (even when no onClose method present)', () => {
		const component = mount(<Modal focusOnFirstElement={focusOnFirstElement}>Content</Modal>)

		document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 27 }))

		expect(ModalUtil.hide).toHaveBeenCalledTimes(1)

		component.unmount()
	})

	test('Esc does not work if preventEsc is set', () => {
		// Prevents esc if onClose is not passed
		const component = mount(<Modal focusOnFirstElement={focusOnFirstElement}>Content</Modal>)

		expect(ModalUtil.hide).toHaveBeenCalledTimes(0)
		expect(onClose).toHaveBeenCalledTimes(0)

		document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 27 }))

		expect(ModalUtil.hide).toHaveBeenCalledTimes(1)
		expect(onClose).toHaveBeenCalledTimes(0)

		component.unmount()
	})

	test('Modal does not close with other keys', () => {
		const component = mount(
			<Modal onClose={onClose} focusOnFirstElement={focusOnFirstElement}>
				Content
			</Modal>
		)

		expect(onClose).toHaveBeenCalledTimes(0)

		document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 28 }))

		expect(onClose).not.toHaveBeenCalled()

		component.unmount()
	})

	test('Tab will focus on nothing if no close or first element', () => {
		const component = mount(
			<Modal>
				<textarea />
			</Modal>
		)

		expect(focusOnFirstElement).toHaveBeenCalledTimes(0)

		component
			.find('div')
			.at(0)
			.find('.first-tab')
			.simulate('focus')

		expect(focusOnFirstElement).not.toHaveBeenCalled()

		component.unmount()
	})

	test('Tab will focus on the first element if no close button', () => {
		const component = mount(
			<Modal focusOnFirstElement={focusOnFirstElement}>
				<textarea />
			</Modal>
		)

		expect(focusOnFirstElement).toHaveBeenCalledTimes(0)

		component
			.find('div')
			.at(0)
			.find('.first-tab')
			.simulate('focus')

		expect(focusOnFirstElement).toHaveBeenCalledTimes(1)

		component.unmount()
	})

	test('Tab will focus on the close button if it exists', () => {
		const component = mount(
			<Modal onClose={onClose} focusOnFirstElement={focusOnFirstElement}>
				<textarea />
			</Modal>
		)

		const deleteButtonFocus = jest.spyOn(component.instance().deleteButtonRef.current, 'focus')
		expect(focusOnFirstElement).toHaveBeenCalledTimes(0)

		component
			.find('div')
			.at(0)
			.find('.first-tab')
			.simulate('focus')

		expect(focusOnFirstElement).toHaveBeenCalledTimes(0)
		expect(deleteButtonFocus).toHaveBeenCalledTimes(1)

		component.unmount()
	})

	test('Unmounts with onClose function', () => {
		const component = mount(
			<Modal onClose={onClose} focusOnFirstElement={focusOnFirstElement}>
				Content
			</Modal>
		)

		component.unmount()

		expect(onClose).not.toHaveBeenCalled()
	})

	test('Unmounts with no onClose function', () => {
		const component = mount(<Modal focusOnFirstElement={focusOnFirstElement}>Content</Modal>)

		component.unmount()

		expect(onClose).not.toHaveBeenCalled()
	})

	test('onTabTrapFocus focuses on deleteButtonRef with onClose prop set', () => {
		const onClose = jest.fn()
		const focusOnFirstElement = jest.fn()
		const focus = jest.fn()
		const component = mount(<Modal onClose={onClose} focusOnFirstElement={focusOnFirstElement} />)

		const inst = component.instance()
		inst.deleteButtonRef = { current: { focus } }
		inst.onTabTrapFocus()

		expect(focus).toHaveBeenCalled()
		expect(focusOnFirstElement).not.toHaveBeenCalled()

		component.unmount()
	})

	test('onTabTrapFocus focuses on focusOnFirstElement with onClose prop not set', () => {
		const focusOnFirstElement = jest.fn()
		const focus = jest.fn()
		const component = mount(<Modal focusOnFirstElement={focusOnFirstElement} />)

		const inst = component.instance()
		inst.deleteButtonRef = { current: { focus } }
		inst.onTabTrapFocus()

		expect(focus).not.toHaveBeenCalled()
		expect(focusOnFirstElement).toHaveBeenCalled()

		component.unmount()
	})

	test('onTabTrapFocus does nothing without focusOnFirstElement or onClose props', () => {
		const focus = jest.fn()
		const component = mount(<Modal />)

		const inst = component.instance()
		inst.deleteButtonRef = { current: { focus } }
		inst.onTabTrapFocus()

		expect(focus).not.toHaveBeenCalled()

		component.unmount()
	})

	test('Modal hides X button if hideCloseButton prop is present', () => {
		const component = renderer.create(<Modal hideCloseButton={true} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})
})
