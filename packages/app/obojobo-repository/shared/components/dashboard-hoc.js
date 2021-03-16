const Dashboard = require('./dashboard')
const connect = require('react-redux').connect
const {
	closeModal,
	addUserToModule,
	loadUsersForModule,
	deleteModulePermissions,
	createNewCollection,
	loadCollectionModules,
	showCollectionManageModules,
	collectionAddModule,
	collectionRemoveModule,
	showCollectionRename,
	renameCollection,
	deleteCollection,
	createNewModule,
	filterModules,
	filterCollections,
	deleteModule,
	showModulePermissions,
	showModuleManageCollections,
	loadModuleCollections,
	moduleAddToCollection,
	moduleRemoveFromCollection,
	showVersionHistory,
	restoreVersion,
	importModuleFile,
	checkModuleLock
} = require('../actions/dashboard-actions')
const mapStoreStateToProps = state => state
const mapActionsToProps = {
	createNewCollection,
	loadCollectionModules,
	showCollectionManageModules,
	collectionAddModule,
	collectionRemoveModule,
	showCollectionRename,
	renameCollection,
	deleteCollection,
	createNewModule,
	closeModal,
	addUserToModule,
	loadUsersForModule,
	deleteModulePermissions,
	filterModules,
	filterCollections,
	deleteModule,
	showModulePermissions,
	showModuleManageCollections,
	loadModuleCollections,
	moduleAddToCollection,
	moduleRemoveFromCollection,
	showVersionHistory,
	restoreVersion,
	importModuleFile,
	checkModuleLock
}
module.exports = connect(
	mapStoreStateToProps,
	mapActionsToProps
)(Dashboard)
