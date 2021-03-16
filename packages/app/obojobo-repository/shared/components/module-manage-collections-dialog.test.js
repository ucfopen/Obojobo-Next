import React from 'react'
import { create, act } from 'react-test-renderer'

import ModuleManageCollectionsDialog from './module-manage-collections-dialog'
import Checkbox from './checkbox'
import Search from './search'

describe('ModuleManageCollectionsDialog', () => {
	let defaultProps

	beforeEach(() => {
		jest.resetAllMocks()

		defaultProps = {
			draftId: 'mockDraftId',
			title: 'Mock Module Title',
			collections: [], // all collections
			draftCollections: [], // collections the module is in
			loadModuleCollections: jest.fn(),
			moduleAddToCollection: jest.fn(),
			moduleRemoveFromCollection: jest.fn(),
			onClose: jest.fn()
		}
	})

	const expectLoadModuleCollectionsToBeCalledOnceWithId = () => {
		expect(defaultProps.loadModuleCollections).toHaveBeenCalledTimes(1)
		expect(defaultProps.loadModuleCollections).toHaveBeenCalledWith('mockDraftId')
	}

	test('renders with "null" collections', () => {
		defaultProps.collections = null
		let component
		act(() => {
			component = create(<ModuleManageCollectionsDialog {...defaultProps} />)
		})

		expectLoadModuleCollectionsToBeCalledOnceWithId()
		expect(component.root.findAllByType(Checkbox).length).toBe(0)
	})

	test('renders with no collections', () => {
		let component
		act(() => {
			component = create(<ModuleManageCollectionsDialog {...defaultProps} />)
		})

		expectLoadModuleCollectionsToBeCalledOnceWithId()
		expect(component.root.findAllByType(Checkbox).length).toBe(0)
	})

	test('renders all collection options', () => {
		defaultProps.collections = [
			{
				id: 'mockCollectionId',
				title: 'A Collection Title'
			},
			{
				id: 'mockCollectionId2',
				title: 'B Collection Title'
			},
			{
				id: 'mockCollectionId3',
				title: 'C Collection Title'
			}
		]
		let component
		act(() => {
			component = create(<ModuleManageCollectionsDialog {...defaultProps} />)
		})

		expectLoadModuleCollectionsToBeCalledOnceWithId()
		expect(component.root.findAllByType(Checkbox).length).toBe(3)
	})

	test('renders filtered collection options', () => {
		defaultProps.collections = [
			{
				id: 'mockCollectionId',
				title: 'A Collection Title'
			},
			{
				id: 'mockCollectionId2',
				title: 'B Collection Title'
			},
			{
				id: 'mockCollectionId3',
				title: 'C Collection Title'
			},
			{
				id: 'mockCollectionId4',
				title: ''
			}
		]
		const reusableComponent = <ModuleManageCollectionsDialog {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		expectLoadModuleCollectionsToBeCalledOnceWithId()
		expect(component.root.findAllByType(Checkbox).length).toBe(4)

		act(() => {
			component.root.findByType(Search).props.onChange('   A ')
			component.update(reusableComponent)
		})

		expect(component.root.findAllByType(Checkbox).length).toBe(1)

		act(() => {
			component.root.findByType(Search).props.onChange(' ')
			component.update(reusableComponent)
		})

		expect(component.root.findAllByType(Checkbox).length).toBe(4)
	})

	test('correctly indicates collections a module is already in', () => {
		defaultProps.collections = [
			{
				id: 'mockCollectionId',
				title: 'A Collection Title'
			},
			{
				id: 'mockCollectionId2',
				title: 'B Collection Title'
			},
			{
				id: 'mockCollectionId3',
				title: 'C Collection Title'
			}
		]
		defaultProps.draftCollections = [
			{
				id: 'mockCollectionId2',
				title: 'B Collection Title'
			}
		]
		const reusableComponent = <ModuleManageCollectionsDialog {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		expectLoadModuleCollectionsToBeCalledOnceWithId()

		const checkBoxes = component.root.findAllByType(Checkbox)
		expect(checkBoxes.length).toBe(3)

		expect(checkBoxes[0].props.checked).toBe(false)
		expect(checkBoxes[1].props.checked).toBe(true)
		expect(checkBoxes[2].props.checked).toBe(false)
	})

	test('included and non-included collections run the expected methods', () => {
		defaultProps.collections = [
			{
				id: 'mockCollectionId',
				title: 'A Collection Title'
			},
			{
				id: 'mockCollectionId2',
				title: 'B Collection Title'
			}
		]
		defaultProps.draftCollections = [
			{
				id: 'mockCollectionId2',
				title: 'B Collection Title'
			}
		]
		const reusableComponent = <ModuleManageCollectionsDialog {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		expectLoadModuleCollectionsToBeCalledOnceWithId()

		const checkBoxes = component.root.findAllByType(Checkbox)
		expect(checkBoxes.length).toBe(2)

		// first item - not included, click should add
		expect(checkBoxes[0].props.checked).toBe(false)
		checkBoxes[0].parent.props.onClick()
		expect(defaultProps.moduleAddToCollection).toHaveBeenCalledTimes(1)
		expect(defaultProps.moduleAddToCollection).toHaveBeenCalledWith(
			defaultProps.draftId,
			'mockCollectionId'
		)

		// second item - included, click should remove
		expect(checkBoxes[1].props.checked).toBe(true)
		checkBoxes[1].parent.props.onClick()
		expect(defaultProps.moduleRemoveFromCollection).toHaveBeenCalledWith(
			defaultProps.draftId,
			'mockCollectionId2'
		)
	})
})
