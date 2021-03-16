jest.mock('react-redux')
jest.mock('../actions/dashboard-actions')
jest.mock('./collection-menu', () => ({}))

import DashboardActions from '../actions/dashboard-actions'
import CollectionMenu from './collection-menu'

describe('CollectionMenu HOC', () => {
	test('redux collect is called with the correct arguments', () => {
		const ReactRedux = require('react-redux')

		const mockReduxConnectReturn = jest.fn()
		ReactRedux.connect = jest.fn()
		ReactRedux.connect.mockReturnValue(mockReduxConnectReturn)

		require('./collection-menu-hoc')

		expect(ReactRedux.connect).toHaveBeenCalledTimes(1)
		expect(ReactRedux.connect).toHaveBeenCalledWith(null, {
			showCollectionManageModules: DashboardActions.showCollectionManageModules,
			showCollectionRename: DashboardActions.showCollectionRename,
			deleteCollection: DashboardActions.deleteCollection
		})

		expect(mockReduxConnectReturn).toHaveBeenCalledTimes(1)
		expect(mockReduxConnectReturn).toHaveBeenCalledWith(CollectionMenu)
	})
})
