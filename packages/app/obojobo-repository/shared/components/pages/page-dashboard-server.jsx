const React = require('react')
const LayoutDefault = require('../layouts/default')
const Dashboard = require('../dashboard-hoc')
const { propsToStore, createCommonReactApp, convertPropsToString } = require('../../react-utils')
const DashboardReducer = require('../../reducers/dashboard-reducer')

const PageDashboardServer = props => (
	<LayoutDefault
		title="Dashboard"
		className="repository--dashboard"
		appScriptUrl={props.appJsUrl}
		appCSSUrl={props.appCSSUrl}
	>
		<span id="react-hydrate-root" data-react-props={convertPropsToString(props)}>
			{createCommonReactApp(Dashboard, propsToStore(DashboardReducer, props))}
		</span>
	</LayoutDefault>
)

PageDashboardServer.defaultProps = {
	dialog: null,
	selectedModule: {},
	draftPermissions: {},
	myCollections: [],
	myModules: [],
	moduleSearchString: '',
	collectionSearchString: '',
	shareSearchString: '',
	versionHistory: {
		hasFetched: false,
		isFetching: false,
		items: []
	},
	searchPeople: {
		hasFetched: false,
		isFetching: false,
		timestamp: 3,
		items: []
	}
}

module.exports = PageDashboardServer
