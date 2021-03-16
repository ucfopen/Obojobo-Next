jest.mock('react-redux')
jest.mock('../actions/dashboard-actions')
jest.mock('./module-search-dialog', () => ({}))

import DashboardActions from '../actions/dashboard-actions'
import ModuleSearchDialog from './module-search-dialog'

describe('ModuleSearchDialog HOC', () => {
	test('redux collect is called with the correct arguments', () => {
		const ReactRedux = require('react-redux')

		const mockReduxConnectReturn = jest.fn()
		ReactRedux.connect = jest.fn(mapStoreStateToProps => {
			//the first argument to 'connect' is a private (untestable) method in the HOC
			//that method will never be 'covered' unless we call it like this
			//since we also know what it should return with what it's given, we can test that too
			const mapStoreStateToPropsArgs = {
				searchModules: {
					items: [{ mockItemKey: 'mockItemVal' }]
				},
				collectionModuleSearchString: 'mockCollectionModuleSearchString'
			}
			const mapStoreStateToPropsReturn = mapStoreStateToProps(mapStoreStateToPropsArgs)
			expect(mapStoreStateToPropsReturn).toEqual({
				searchModules: [{ mockItemKey: 'mockItemVal' }],
				searchString: 'mockCollectionModuleSearchString'
			})
			return mockReduxConnectReturn
		})

		require('./module-search-dialog-hoc')

		expect(ReactRedux.connect).toHaveBeenCalledTimes(1)
		expect(ReactRedux.connect).toHaveBeenCalledWith(expect.any(Function), {
			onSearchChange: DashboardActions.searchForModuleNotInCollection,
			clearModuleSearchResults: DashboardActions.clearModuleSearchResults
		})

		expect(mockReduxConnectReturn).toHaveBeenCalledTimes(1)
		expect(mockReduxConnectReturn).toHaveBeenCalledWith(ModuleSearchDialog)
	})
})
