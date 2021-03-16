jest.mock('react-modal', () => props => {
	return <mock-ReactModal {...props}></mock-ReactModal>
})

jest.mock('./module-search-dialog-hoc', () => props => {
	return <mock-ModuleSearchDialog {...props}>{props.children}</mock-ModuleSearchDialog>
})

import React from 'react'
import ReactModal from 'react-modal'
import CollectionManageModulesDialog from './collection-manage-modules-dialog'
import CollectionModuleListItem from './collection-module-list-item'
import ModuleSearchDialog from './module-search-dialog-hoc'
import Button from './button'

import { create, act } from 'react-test-renderer'

describe('CollectionManageModulesDialog', () => {
	jest.mock('./collection-module-list-item')

	let defaultProps

	beforeEach(() => {
		jest.resetAllMocks()

		defaultProps = {
			collection: {
				id: 'mockCollectionId',
				title: 'mockCollectionTitle'
			},
			collectionModules: [],
			loadCollectionModules: jest.fn(),
			collectionAddModule: jest.fn(),
			collectionRemoveModule: jest.fn(),
			onClose: jest.fn()
		}
	})

	const expectLoadCollectionModulesToBeCalledOnceWithId = () => {
		expect(defaultProps.loadCollectionModules).toHaveBeenCalledTimes(1)
		expect(defaultProps.loadCollectionModules).toHaveBeenCalledWith('mockCollectionId')
	}

	const expectModuleSearchModalToBeRendered = (component, isRendered) => {
		expect(component.root.findAllByType(ReactModal).length).toBe(isRendered ? 1 : 0)
		expect(component.root.findAllByType(ModuleSearchDialog).length).toBe(isRendered ? 1 : 0)
	}

	test('renders with "null" collection modules', () => {
		defaultProps.collectionModules = null
		let component
		act(() => {
			component = create(<CollectionManageModulesDialog {...defaultProps} />)
		})

		expectLoadCollectionModulesToBeCalledOnceWithId()
		expect(component.root.findAllByType(CollectionModuleListItem).length).toBe(0)
	})

	test('renders with no collection modules', () => {
		let component
		act(() => {
			component = create(<CollectionManageModulesDialog {...defaultProps} />)
		})

		expectLoadCollectionModulesToBeCalledOnceWithId()
		expect(component.root.findAllByType(CollectionModuleListItem).length).toBe(0)
	})

	test('renders with collection modules', () => {
		defaultProps.collectionModules = [
			{ draftId: 'mockDraftId' },
			{ draftId: 'mockDraftId2' },
			{ draftId: 'mockDraftId3' }
		]
		let component
		act(() => {
			component = create(<CollectionManageModulesDialog {...defaultProps} />)
		})

		expectLoadCollectionModulesToBeCalledOnceWithId()
		expect(component.root.findAllByType(CollectionModuleListItem).length).toBe(3)
	})

	test('"Add Module" button opens the module search modal', () => {
		const reusableComponent = <CollectionManageModulesDialog {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		expectModuleSearchModalToBeRendered(component, false)

		act(() => {
			component.root.findByProps({ className: 'add-module-button' }).props.onClick()
			component.update(reusableComponent)
		})

		expectModuleSearchModalToBeRendered(component, true)
	})

	test('modal closes the module search modal when callback is called', () => {
		const reusableComponent = <CollectionManageModulesDialog {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		expectModuleSearchModalToBeRendered(component, false)

		act(() => {
			component.root.findByProps({ className: 'add-module-button' }).props.onClick()
			component.update(reusableComponent)
		})

		expectModuleSearchModalToBeRendered(component, true)

		act(() => {
			component.root.findByType(ReactModal).props.onRequestClose()
			component.update(reusableComponent)
		})

		expectModuleSearchModalToBeRendered(component, false)
	})

	test('module search dialog closes the module search modal when callback is called', () => {
		const reusableComponent = <CollectionManageModulesDialog {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		expectModuleSearchModalToBeRendered(component, false)

		act(() => {
			component.root.findByProps({ className: 'add-module-button' }).props.onClick()
			component.update(reusableComponent)
		})

		expectModuleSearchModalToBeRendered(component, true)

		act(() => {
			component.root.findByType(ModuleSearchDialog).props.onClose()
			component.update(reusableComponent)
		})

		expectModuleSearchModalToBeRendered(component, false)
	})

	test('props.collectionRemoveModule is called when a module list item "x" button is clicked', () => {
		defaultProps.collectionModules = [
			{ draftId: 'mockDraftId' },
			{ draftId: 'mockDraftId2' },
			{ draftId: 'mockDraftId3' }
		]
		const reusableComponent = <CollectionManageModulesDialog {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		expectLoadCollectionModulesToBeCalledOnceWithId()

		const moduleListItems = component.root.findAllByType(CollectionModuleListItem)
		expect(moduleListItems.length).toBe(3)
		expect(moduleListItems[0].props.draftId).toBe('mockDraftId')
		expect(moduleListItems[1].props.draftId).toBe('mockDraftId2')
		expect(moduleListItems[2].props.draftId).toBe('mockDraftId3')

		act(() => {
			moduleListItems[1].findByType(Button).props.onClick()
		})

		expect(defaultProps.collectionRemoveModule).toHaveBeenCalledTimes(1)
		expect(defaultProps.collectionRemoveModule).toHaveBeenCalledWith(
			'mockDraftId2',
			'mockCollectionId'
		)
	})

	test('props.collectionAddModule is called when ModuleSearchDialog.onSelectModule is called', () => {
		const reusableComponent = <CollectionManageModulesDialog {...defaultProps} />
		let component
		act(() => {
			component = create(reusableComponent)
		})

		expectModuleSearchModalToBeRendered(component, false)

		act(() => {
			component.root.findByProps({ className: 'add-module-button' }).props.onClick()
			component.update(reusableComponent)
		})

		expectModuleSearchModalToBeRendered(component, true)

		act(() => {
			component.root.findByType(ModuleSearchDialog).props.onSelectModule('mockDraftId')
			component.update(reusableComponent)
		})
		expect(defaultProps.collectionAddModule).toHaveBeenCalledTimes(1)
		expect(defaultProps.collectionAddModule).toHaveBeenCalledWith('mockDraftId', 'mockCollectionId')

		//should also close the search modal
		expectModuleSearchModalToBeRendered(component, false)
	})

	test('"close" and "done" buttons call props.onClose', () => {
		let component
		act(() => {
			component = create(<CollectionManageModulesDialog {...defaultProps} />)
		})

		act(() => {
			component.root.findByProps({ className: 'close-button' }).props.onClick()
			component.root.findByProps({ className: 'done-button secondary-button' }).props.onClick()
		})
		expect(defaultProps.onClose).toHaveBeenCalledTimes(2)
	})
})
