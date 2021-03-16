const ModuleSearchDialog = require('./module-search-dialog')
const connect = require('react-redux').connect
const {
	searchForModuleNotInCollection,
	clearModuleSearchResults
} = require('../actions/dashboard-actions')
const mapStoreStateToProps = state => ({
	searchModules: state.searchModules.items,
	searchString: state.collectionModuleSearchString
})
const mapActionsToProps = {
	onSearchChange: searchForModuleNotInCollection,
	clearModuleSearchResults
}

module.exports = connect(
	mapStoreStateToProps,
	mapActionsToProps
)(ModuleSearchDialog)
