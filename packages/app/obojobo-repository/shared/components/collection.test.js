jest.mock('short-uuid')
jest.mock('./collection-menu-hoc', () => props => {
	return <mock-CollectionMenu {...props}>{props.children}</mock-CollectionMenu>
})

import React from 'react'
import Collection from './collection'
import CollectionMenu from './collection-menu-hoc'

import { create, act } from 'react-test-renderer'

describe('Collection', () => {
	const mockShortFromUUID = jest.fn()

	let defaultProps
	let short

	beforeEach(() => {
		jest.resetAllMocks()
		jest.useFakeTimers()

		defaultProps = {
			id: 'mockCollectionId',
			title: 'Mock Collection Title',
			hasMenu: true
		}

		short = require('short-uuid')
		mockShortFromUUID.mockReturnValue('mockCollectionShortId')
		short.mockReturnValue({
			fromUUID: mockShortFromUUID
		})
	})

	test('renders with expected standard props', () => {
		const component = create(<Collection {...defaultProps} />)

		expect(mockShortFromUUID).toHaveBeenCalledTimes(1)
		expect(mockShortFromUUID).toHaveBeenCalledWith('mockCollectionId')

		expect(component.root.findAllByType(CollectionMenu).length).toBe(0)

		expect(component.root.children[0].props.className).toBe(
			'repository--collection-icon is-not-open'
		)

		const mainChildComponent = component.root.children[0].children[0]
		expect(mainChildComponent.type).toBe('button')

		expect(component.toJSON()).toMatchSnapshot()
	})

	test('renders with expected standard props but hasMenu=false', () => {
		defaultProps.hasMenu = false
		const component = create(<Collection {...defaultProps} />)

		expect(mockShortFromUUID).toHaveBeenCalledTimes(1)
		expect(mockShortFromUUID).toHaveBeenCalledWith('mockCollectionId')

		expect(component.root.findAllByType(CollectionMenu).length).toBe(0)

		expect(component.root.children[0].props.className).toBe(
			'repository--collection-icon is-not-open'
		)

		const mainChildComponent = component.root.children[0].children[0]
		expect(mainChildComponent.type).toBe('a')
		expect(mainChildComponent.props.href).toBe(
			'/collections/mock-collection-title-mockCollectionShortId'
		)

		expect(component.toJSON()).toMatchSnapshot()
	})

	test('clicking the main child component when hasMenu=true renders the collection menu', () => {
		const reusableComponent = <Collection {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		expect(component.root.findAllByType(CollectionMenu).length).toBe(0)

		const mockClickEvent = {
			preventDefault: jest.fn()
		}
		act(() => {
			component.root.children[0].children[0].props.onClick(mockClickEvent)
			component.update(reusableComponent)
		})
		expect(mockClickEvent.preventDefault).toHaveBeenCalledTimes(1)
		expect(component.root.findAllByType(CollectionMenu).length).toBe(1)
	})

	test('the collection menu is not rendered after onMouseLeave is called', () => {
		const reusableComponent = <Collection {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		expect(component.root.findAllByType(CollectionMenu).length).toBe(0)

		act(() => {
			const mockClickEvent = {
				preventDefault: jest.fn()
			}
			component.root.children[0].children[0].props.onClick(mockClickEvent)
			component.update(reusableComponent)
		})
		expect(component.root.findAllByType(CollectionMenu).length).toBe(1)

		act(() => {
			component.root.children[0].props.onMouseLeave()
			component.update(reusableComponent)
		})

		expect(component.root.findAllByType(CollectionMenu).length).toBe(0)
	})

	test('keyboard focus and blur close the collection menu as necessary', () => {
		const reusableComponent = <Collection {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		expect(component.root.findAllByType(CollectionMenu).length).toBe(0)

		act(() => {
			component.root.children[0].props.onFocus()
		})

		expect(window.clearTimeout).toHaveBeenCalledTimes(1)

		// bring up the collection menu now so we can make sure it's gone later
		act(() => {
			const mockClickEvent = {
				preventDefault: jest.fn()
			}
			component.root.children[0].children[0].props.onClick(mockClickEvent)
			component.update(reusableComponent)
		})
		expect(component.root.findAllByType(CollectionMenu).length).toBe(1)

		act(() => {
			component.root.children[0].props.onBlur()

			expect(window.setTimeout).toHaveBeenCalledTimes(1)
			jest.runAllTimers()

			component.update(reusableComponent)
		})

		expect(component.root.findAllByType(CollectionMenu).length).toBe(0)
	})
})
