import React from 'react'
import CollectionModuleListItem from './collection-module-list-item'
import { mount } from 'enzyme'

describe('CollectionModuleListItem', () => {
	let defaultProps

	beforeEach(() => {
		defaultProps = {
			draftId: 'mockDraftId',
			title: 'mockDraftTitle'
		}
	})

	test('renders correctly when props.alreadyInCollection is false/missing', () => {
		const component = mount(<CollectionModuleListItem {...defaultProps} />)

		expect(component.find('li').prop('className')).toBe(
			'module-list-item is-not-already-in-collection'
		)
	})

	test('renders correctly when props.alreadyInCollection is true', () => {
		defaultProps.alreadyInCollection = true
		const component = mount(<CollectionModuleListItem {...defaultProps} />)

		expect(component.find('li').prop('className')).toBe('module-list-item is-already-in-collection')
	})
})
