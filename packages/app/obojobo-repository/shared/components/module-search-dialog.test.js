jest.mock('./search', () => props => {
	return <mock-Search {...props}></mock-Search>
})
import React from 'react'
import { create, act } from 'react-test-renderer'

import ModuleSearchDialog from './module-search-dialog'
import Search from './search'
import CollectionModuleListItem from './collection-module-list-item'
import Button from './button'

describe('ModuleSearchDialog', () => {
	let defaultProps

	beforeEach(() => {
		defaultProps = {
			collectionId: 'mockCollectionId',
			collectionModules: [],
			searchModules: [],
			clearModuleSearchResults: jest.fn(),
			onSearchChange: jest.fn(),
			onSelectModule: jest.fn(),
			onClose: jest.fn()
		}
	})

	test('renders with no searchModules', () => {
		let component
		act(() => {
			component = create(<ModuleSearchDialog {...defaultProps} />)
		})

		expect(defaultProps.clearModuleSearchResults).toHaveBeenCalledTimes(1)

		expect(component.toJSON()).toMatchSnapshot()
	})

	test('changing search field should call onSearchChange', () => {
		let component
		act(() => {
			component = create(<ModuleSearchDialog {...defaultProps} />)
		})

		// changing the text of the search field should call props.filterCollections
		const filterChangePayload = { target: { value: 'string' } }
		component.root.findByType(Search).props.onChange(filterChangePayload)
		expect(defaultProps.onSearchChange).toHaveBeenCalledTimes(1)
		expect(defaultProps.onSearchChange).toHaveBeenCalledWith(
			filterChangePayload,
			'mockCollectionId'
		)
	})

	test('renders with searchModules and collectionModules', () => {
		defaultProps.searchModules = [
			{
				draftId: 'mockDraftId',
				title: 'Mock Draft Title'
			},
			{
				draftId: 'mockDraftId2',
				title: 'Mock Draft Title 2'
			}
		]
		defaultProps.collectionModules = [
			{
				draftId: 'mockDraftId',
				title: 'Mock Draft Title'
			}
		]
		let component
		act(() => {
			component = create(<ModuleSearchDialog {...defaultProps} />)
		})

		const collectionModuleListItems = component.root.findAllByType(CollectionModuleListItem)
		expect(collectionModuleListItems.length).toBe(2)
		// CollectionModuleListItem's 'alreadyInCollection' prop will be true if a module search
		//  result matches a module already in the collection; there will also be no button
		expect(collectionModuleListItems[0].props.alreadyInCollection).toBe(true)
		expect(collectionModuleListItems[0].findAllByType(Button).length).toBe(0)
		expect(collectionModuleListItems[1].props.alreadyInCollection).toBe(false)
		expect(collectionModuleListItems[1].findAllByType(Button).length).toBe(1)
	})

	test('clicking the "Select" button in a module search result calls onSelectModule', () => {
		defaultProps.searchModules = [
			{
				draftId: 'mockDraftId',
				title: 'Mock Draft Title'
			}
		]
		let component
		act(() => {
			component = create(<ModuleSearchDialog {...defaultProps} />)
		})

		expect(component.root.findAllByType(CollectionModuleListItem).length).toBe(1)

		component.root
			.findByType(CollectionModuleListItem)
			.findByType(Button)
			.props.onClick()

		expect(defaultProps.onSelectModule).toHaveBeenCalledTimes(1)
		expect(defaultProps.onSelectModule).toHaveBeenCalledWith('mockDraftId')
	})

	test('clicking the "x" button calls onClose', () => {
		let component
		act(() => {
			component = create(<ModuleSearchDialog {...defaultProps} />)
		})

		component.root.findByProps({ className: 'close-button' }).props.onClick()
		expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
	})
})
