import React from 'react'
import CollectionRenameDialog from './collection-rename-dialog'

import { create, act } from 'react-test-renderer'

describe('CollectionRenameDialog', () => {
	let defaultProps

	beforeEach(() => {
		jest.resetAllMocks()

		defaultProps = {
			collection: {
				id: 'mockCollectionId',
				title: 'mockCollectionTitle'
			},
			onAccept: jest.fn(),
			onClose: jest.fn()
		}
	})

	test('renders with expected standard props', () => {
		defaultProps.collectionModules = null
		const component = create(<CollectionRenameDialog {...defaultProps} />)
		expect(component.toJSON()).toMatchSnapshot()
	})

	test('input onChange event changes state and sets its own value properly', () => {
		defaultProps.collectionModules = null
		const reusableComponent = <CollectionRenameDialog {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		expect(component.root.findByType('input').props.value).toBe('mockCollectionTitle')

		const mockEventObject = {
			target: {
				value: 'mockInputValue'
			}
		}

		act(() => {
			component.root.findByType('input').props.onChange(mockEventObject)
			component.update(reusableComponent)
		})

		expect(component.root.findByType('input').props.value).toBe('mockInputValue')
	})

	test('clicking the "Accept" button calls props.onAccept and props.onClose', () => {
		defaultProps.collectionModules = null
		const reusableComponent = <CollectionRenameDialog {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		const mockEventObject = {
			target: {
				value: 'mockInputValue'
			}
		}
		act(() => {
			component.root.findByType('input').props.onChange(mockEventObject)
			component.update(reusableComponent)
		})

		expect(component.root.findByType('input').props.value).toBe('mockInputValue')

		act(() => {
			component.root.findByProps({ className: 'done-button secondary-button' }).props.onClick()
		})

		expect(defaultProps.onAccept).toHaveBeenCalledTimes(1)
		expect(defaultProps.onAccept).toHaveBeenCalledWith('mockCollectionId', 'mockInputValue')

		expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
	})

	test('clicking the "x" button calls props.onClose', () => {
		defaultProps.collectionModules = null
		let component
		act(() => {
			component = create(<CollectionRenameDialog {...defaultProps} />)
		})

		act(() => {
			component.root.findByProps({ className: 'close-button' }).props.onClick()
		})

		expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
	})
})
