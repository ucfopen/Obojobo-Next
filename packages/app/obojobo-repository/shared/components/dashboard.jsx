require('./modal.scss')
require('./dashboard.scss')

const React = require('react')
const { useState, useEffect } = require('react')
const RepositoryNav = require('./repository-nav')
const RepositoryBanner = require('./repository-banner')
const Collection = require('./collection')
const CollectionManageModulesDialog = require('./collection-manage-modules-dialog')
const CollectionRenameDialog = require('./collection-rename-dialog')
const Module = require('./module')
const ModuleManageCollectionsDialog = require('./module-manage-collections-dialog')
const ModulePermissionsDialog = require('./module-permissions-dialog')
const ModuleOptionsDialog = require('./module-options-dialog')
const VersionHistoryDialog = require('./version-history-dialog')
const Button = require('./button')
const ButtonLink = require('./button-link')
const MultiButton = require('./multi-button')
const Search = require('./search')
const ReactModal = require('react-modal')

const short = require('short-uuid')

const { MODE_RECENT, MODE_ALL, MODE_COLLECTION } = require('../repository-constants')

const renderOptionsDialog = (props, extension) => (
	<ModuleOptionsDialog
		title=""
		{...props.selectedModule}
		showModuleManageCollections={props.showModuleManageCollections}
		showModulePermissions={props.showModulePermissions}
		deleteModule={extension.deleteModule}
		onClose={props.closeModal}
		showVersionHistory={props.showVersionHistory}
	/>
)

const renderPermissionsDialog = (props, extension) => (
	<ModulePermissionsDialog
		title=""
		{...props.selectedModule}
		searchState={props.searchPeople}
		loadUsersForModule={props.loadUsersForModule}
		onClose={props.closeModal}
		addUserToModule={props.addUserToModule}
		draftPermissions={props.draftPermissions}
		deleteModulePermissions={extension.deleteModulePermissions}
		currentUserId={props.currentUser.id}
	/>
)

const renderModuleManageCollectionsDialog = (props, extension) => (
	<ModuleManageCollectionsDialog
		title=""
		{...props.selectedModule}
		collections={props.myCollections}
		onClose={props.closeModal}
		loadModuleCollections={props.loadModuleCollections}
		draftCollections={props.draftCollections}
		moduleAddToCollection={extension.moduleAddToCollection}
		moduleRemoveFromCollection={extension.moduleRemoveFromCollection}
	/>
)

const renderCollectionManageModulesDialog = (props, extension) => (
	<CollectionManageModulesDialog
		title=""
		collection={props.selectedCollection}
		loadCollectionModules={props.loadCollectionModules}
		collectionModules={props.collectionModules}
		collectionAddModule={extension.collectionAddModule}
		collectionRemoveModule={extension.collectionRemoveModule}
		onClose={props.closeModal}
	/>
)

const renderCollectionRenameDialog = (props, extension) => (
	<CollectionRenameDialog
		title="Rename Collection"
		collection={props.selectedCollection}
		onClose={props.closeModal}
		onAccept={extension.renameCollection}
	/>
)

const extendedPropsDefault = props => ({
	renameCollection: props.renameCollection,
	collectionAddModule: props.collectionAddModule,
	collectionRemoveModule: props.collectionRemoveModule,
	moduleAddToCollection: props.moduleAddToCollection,
	moduleRemoveFromCollection: props.moduleRemoveFromCollection,
	deleteModule: props.deleteModule,
	deleteModulePermissions: props.deleteModulePermissions
})

const renderVersionHistoryDialog = props => (
	<VersionHistoryDialog
		{...props.selectedModule}
		title={`${props.selectedModule.title} - Version History`}
		onClose={props.closeModal}
		isHistoryLoading={props.versionHistory.isFetching}
		hasHistoryLoaded={props.versionHistory.hasFetched}
		versionHistory={props.versionHistory.items}
		restoreVersion={props.restoreVersion}
		checkModuleLock={props.checkModuleLock}
		currentUserId={props.currentUser.id}
	/>
)

const renderModalDialog = props => {
	let dialog
	let title
	const extendedOptions = {
		mode: props.mode
	}
	const extendedProps = extendedPropsDefault(props)
	switch (props.mode) {
		case MODE_COLLECTION:
			extendedOptions.collectionId = props.collection.id
			extendedProps.renameCollection = (collectionId, newTitle) => {
				props.renameCollection(collectionId, newTitle, extendedOptions)
			}
			extendedProps.collectionAddModule = (draftId, collectionId) => {
				props.collectionAddModule(draftId, collectionId, extendedOptions)
			}
			extendedProps.collectionRemoveModule = (draftId, collectionId) => {
				props.collectionRemoveModule(draftId, collectionId, extendedOptions)
			}
			extendedProps.moduleAddToCollection = (draftId, collectionId) => {
				props
					.moduleAddToCollection(draftId, collectionId)
					.then(() => props.loadCollectionModules(collectionId, extendedOptions))
			}
			extendedProps.moduleRemoveFromCollection = (draftId, collectionId) => {
				props
					.moduleRemoveFromCollection(draftId, collectionId)
					.then(() => props.loadCollectionModules(collectionId, extendedOptions))
			}
			extendedProps.deleteModule = draftId => {
				props.deleteModule(draftId, extendedOptions)
			}
			extendedProps.deleteModulePermissions = (draftId, userId) => {
				props.deleteModulePermissions(draftId, userId, extendedOptions)
			}
			break

		case MODE_RECENT:
		default:
			extendedProps.deleteModule = draftId => {
				props.deleteModule(draftId, extendedOptions)
			}
			extendedProps.deleteModulePermissions = (draftId, userId) => {
				props.deleteModulePermissions(draftId, userId, extendedOptions)
			}
	}

	switch (props.dialog) {
		case 'module-more':
			title = 'Module Options'
			dialog = renderOptionsDialog(props, extendedProps)
			break

		case 'module-permissions':
			title = 'Module Access'
			dialog = renderPermissionsDialog(props, extendedProps)
			break

		case 'module-manage-collections':
			title = 'Module Collections'
			dialog = renderModuleManageCollectionsDialog(props, extendedProps)
			break

		case 'collection-manage-modules':
			title = ''
			dialog = renderCollectionManageModulesDialog(props, extendedProps)
			break

		case 'collection-rename':
			title = 'Rename Collection'
			dialog = renderCollectionRenameDialog(props, extendedProps)
			break

		case 'module-version-history':
			title = 'Module Version History'
			dialog = renderVersionHistoryDialog(props)
			break

		default:
			return null
	}

	ReactModal.setAppElement('#dashboard-root')

	return (
		<ReactModal
			isOpen={true}
			contentLabel={title}
			className="repository--modal"
			overlayClassName="repository--modal-overlay"
			onRequestClose={props.closeModal}
		>
			{dialog}
		</ReactModal>
	)
}

const getSortMethod = sortOrder => {
	let sortFn
	switch (sortOrder) {
		case 'alphabetical':
			sortFn = (a, b) => a.title.localeCompare(b.title)
			break

		case 'newest':
			sortFn = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
			break

		case 'last updated':
			sortFn = (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
			break
	}

	return sortFn
}

const renderModules = (modules, sortOrder, newModuleId, newModuleButton) => {
	if (modules.length < 1) {
		return (
			<p className="repository--item-list--collection--empty-placeholder">
				<span className="repository--item-list--collection--empty-placeholder--text">
					Nothing to see here!
				</span>
				{newModuleButton}
			</p>
		)
	}

	const sortFn = getSortMethod(sortOrder)
	return modules
		.sort(sortFn)
		.map(draft => (
			<Module isNew={draft.draftId === newModuleId} key={draft.draftId} hasMenu={true} {...draft} />
		))
}

const renderCollections = (collections, sortOrder, newCollectionButton) => {
	if (collections.length < 1) {
		return (
			<p className="repository--item-list--collection--empty-placeholder">
				<span className="repository--item-list--collection--empty-placeholder--text">
					Nothing to see here!
				</span>
				{newCollectionButton}
			</p>
		)
	}

	const sortFn = getSortMethod(sortOrder)
	return collections
		.sort(sortFn)
		.map(collection => <Collection key={collection.id} hasMenu={true} {...collection} />)
}

const renderCollectionManageArea = props => {
	const onManageButtonClick = () => props.showCollectionManageModules(props.collection)

	const onRenameButtonClick = () => props.showCollectionRename(props.collection)

	const onDeleteButtonClick = () => {
		//eslint-disable-next-line no-alert, no-undef
		const response = confirm(
			`Delete collection "${props.collection.title}"? Modules in this collection will not be deleted.`
		)
		if (!response) return
		props.deleteCollection(props.collection).then(() => {
			window.location.assign('/dashboard')
		})
	}

	return (
		<React.Fragment>
			<Button onClick={onManageButtonClick} className="manage-modules">
				Manage Modules
			</Button>
			<Button onClick={onRenameButtonClick} className="rename">
				Rename
			</Button>
			<Button onClick={onDeleteButtonClick} className="dangerous-button">
				Delete Collection
			</Button>
		</React.Fragment>
	)
}

const Dashboard = props => {
	const [moduleSortOrder, setModuleSortOrder] = useState(props.moduleSortOrder)
	const [collectionSortOrder, setCollectionSortOrder] = useState(props.collectionSortOrder)
	const [newModuleId, setNewModuleId] = useState(null)

	// Set a cookie when moduleSortOrder or collectionSortOrder change on the client
	// can't undefine document to test this 'else' case without breaking everything
	/* istanbul ignore else */
	if (typeof document !== 'undefined') {
		useEffect(() => {
			const expires = new Date()
			expires.setFullYear(expires.getFullYear() + 1)
			let modeUrlString = '/dashboard'

			// Placeholder variable - will be set to an instance of shortUUID if needed
			let translator = null

			switch (props.mode) {
				case MODE_COLLECTION:
					translator = short()
					modeUrlString =
						'/collections/' +
						encodeURI(props.collection.title.replace(/\s+/g, '-').toLowerCase()) +
						'-' +
						translator.fromUUID(props.collection.id)
					break
				case MODE_ALL:
					modeUrlString = `${modeUrlString}/all`
					break
			}
			const commonCookieString = `expires=${expires.toUTCString()}; path=${modeUrlString}`
			document.cookie = `moduleSortOrder=${moduleSortOrder}; ${commonCookieString}`
			document.cookie = `collectionSortOrder=${collectionSortOrder}; ${commonCookieString}`
		}, [moduleSortOrder, collectionSortOrder])
	}

	const newCollectionButtonRender = (
		<Button onClick={() => props.createNewCollection()}>New Collection</Button>
	)

	// Elements to render in the 'My Collections' part of the page
	// Will only appear when dashboard is in 'recent' mode
	let collectionAreaRender = null

	// Text content of the dashboard module section's title
	// Either 'My Recent Modules' (recent), 'My Modules' (all), or 'Modules In <collection title' (collection)
	let modulesTitle = 'My Recent Modules'

	// Extra class to apply to module section's title
	// Will be 'stretch-width' when module sort component is not present
	//  or an empty string when it is
	let modulesTitleExtraClass = ''

	// Components to render for module sort options
	// Will not be necessary when dashboard is in 'recent' mode
	let moduleSortRender = (
		<div className="repository--main-content--sort repository--module-sort">
			<span>Sort</span>
			<select value={moduleSortOrder} onChange={event => setModuleSortOrder(event.target.value)}>
				<option value="newest">Newest</option>
				<option value="alphabetical">Alphabetical</option>
				<option value="last updated">Last updated</option>
			</select>
		</div>
	)

	// Components to render for module filter input
	// Will not be necessary when dashboard is in 'recent' mode
	let moduleFilterRender = (
		<Search
			value={props.moduleSearchString}
			placeholder="Filter Modules..."
			onChange={props.filterModules}
		/>
	)

	// Components to render an 'All Modules' button (default mode)
	// Will not be necessary when dashboard is in 'all' or 'collection' modes
	let allModulesButtonRender = null

	// 'New Collection' button and horizontal divider
	// Will only appear when dashboard is in 'recent' mode
	let newCollectionOptionsRender = null

	const createNewModuleOptions = {
		mode: props.mode
	}

	// Components for managing the current collection
	// Will only appear when dashboard is in 'collection' mode
	let collectionManageAreaRender = null

	switch (props.mode) {
		// url is /collections/collection-name-and-short-uuid
		case MODE_COLLECTION:
			collectionManageAreaRender = renderCollectionManageArea(props)
			createNewModuleOptions.collectionId = props.collection.id
			modulesTitle = `Modules in '${props.collection.title}'`
			break
		// url is /dashboard/modules
		case MODE_ALL:
			collectionAreaRender = null
			modulesTitle = 'My Modules'
			break
		// url is /dashboard
		case MODE_RECENT:
		default:
			if (props.myModules.length < props.moduleCount) {
				allModulesButtonRender = (
					<ButtonLink
						className="repository--all-modules--button"
						url="/dashboard/all"
						target="_blank"
					>
						All Modules
					</ButtonLink>
				)
			}

			newCollectionOptionsRender = (
				<React.Fragment>
					{newCollectionButtonRender}
					<hr />
				</React.Fragment>
			)

			// eslint-disable-next-line no-case-declarations
			let collectionFilterRender = null
			if (props.myCollections.length > 0) {
				collectionFilterRender = (
					<Search
						value={props.collectionSearchString}
						placeholder="Filter Collections..."
						onChange={props.filterCollections}
					/>
				)
			}

			collectionAreaRender = (
				<React.Fragment>
					<div className="repository--main-content--title repository--my-collections-title">
						<span>My Collections</span>
						<div className="repository--main-content--sort repository--collection-sort">
							<span>Sort</span>
							<select
								value={collectionSortOrder}
								onChange={event => setCollectionSortOrder(event.target.value)}
							>
								<option value="newest">Newest</option>
								<option value="alphabetical">Alphabetical</option>
							</select>
						</div>
					</div>
					{collectionFilterRender}
					<div className="repository--item-list--collection">
						<div className="repository--item-list--collection--item-wrapper">
							<div className="repository--item-list--row">
								<div className="repository--item-list--collection--item--multi-wrapper">
									{renderCollections(
										props.filteredCollections ? props.filteredCollections : props.myCollections,
										collectionSortOrder,
										newCollectionButtonRender
									)}
								</div>
							</div>
						</div>
					</div>
				</React.Fragment>
			)
			moduleFilterRender = null
			moduleSortRender = null
			modulesTitleExtraClass = 'stretch-width'
	}

	const onNewModuleClick = useTutorial => {
		props.createNewModule(useTutorial, createNewModuleOptions).then(data => {
			data.payload.value.sort(getSortMethod('newest'))
			setNewModuleId(data.payload.value[0].draftId)
		})
	}

	const newModuleButtonRender = <Button onClick={() => onNewModuleClick(false)}>New Module</Button>

	return (
		<span id="dashboard-root">
			<RepositoryNav
				userId={props.currentUser.id}
				avatarUrl={props.currentUser.avatarUrl}
				displayName={`${props.currentUser.firstName} ${props.currentUser.lastName}`}
				noticeCount={0}
			/>
			<RepositoryBanner title={props.title} className="default-bg" facts={props.facts} />
			<div className="repository--section-wrapper">
				<section className="repository--main-content">
					<div className="repository--main-content--control-bar">
						<MultiButton title="Create New" className="repository--main-content--new-module-button">
							{newCollectionOptionsRender}
							{newModuleButtonRender}
							<Button onClick={() => onNewModuleClick(true)}>New Tutorial</Button>
							<Button onClick={props.importModuleFile}>Upload...</Button>
						</MultiButton>
						{collectionManageAreaRender}
						{moduleFilterRender}
					</div>
					<div
						className={`repository--main-content--title repository--my-modules-title ${modulesTitleExtraClass}`}
					>
						<span>{modulesTitle}</span>
						{moduleSortRender}
					</div>
					<div className="repository--item-list--collection">
						<div className="repository--item-list--collection--item-wrapper">
							<div className="repository--item-list--row">
								<div className="repository--item-list--collection--item--multi-wrapper">
									{renderModules(
										props.filteredModules ? props.filteredModules : props.myModules,
										moduleSortOrder,
										newModuleId,
										newModuleButtonRender
									)}
									{allModulesButtonRender}
								</div>
							</div>
						</div>
					</div>
					{collectionAreaRender}
				</section>
			</div>
			{props.dialog ? renderModalDialog(props) : null}
		</span>
	)
}

module.exports = Dashboard
