const CollectionMenu = require('./collection-menu')
const connect = require('react-redux').connect
const {
	showCollectionManageModules,
	showCollectionRename,
	deleteCollection
} = require('../actions/dashboard-actions')
const mapActionsToProps = { showCollectionManageModules, showCollectionRename, deleteCollection }
module.exports = connect(
	null,
	mapActionsToProps
)(CollectionMenu)
