require('./modal.scss')
require('./dashboard.scss')

const React = require('react')
const { useState, useEffect } = require('react')
const RepositoryNav = require('./repository-nav')
const RepositoryBanner = require('./repository-banner')
const Module = require('./module')
const ModulePermissionsDialog = require('./module-permissions-dialog')
const ModuleOptionsDialog = require('./module-options-dialog')
const VersionHistoryDialog = require('./version-history-dialog')
const Button = require('./button')
const MultiButton = require('./multi-button')
const Search = require('./search')
const ReactModal = require('react-modal')
const AssessmentScoreDataDialog = require('./assessment-score-data-dialog')
const Spinner = require('./spinner')

const renderOptionsDialog = props => (
	<ModuleOptionsDialog
		title=""
		{...props.selectedModule}
		showModulePermissions={props.showModulePermissions}
		deleteModule={props.deleteModule}
		onClose={props.closeModal}
		showVersionHistory={props.showVersionHistory}
		showAssessmentScoreData={props.showAssessmentScoreData}
	/>
)

const renderPermissionsDialog = props => (
	<ModulePermissionsDialog
		title=""
		{...props.selectedModule}
		searchState={props.searchPeople}
		loadUsersForModule={props.loadUsersForModule}
		onClose={props.closeModal}
		addUserToModule={props.addUserToModule}
		draftPermissions={props.draftPermissions}
		deleteModulePermissions={props.deleteModulePermissions}
		currentUserId={props.currentUser.id}
	/>
)

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

const renderAssessmentScoreDataDialog = props => {
	return (
		<AssessmentScoreDataDialog
			{...props.selectedModule}
			title={`${props.selectedModule.title} - Assessment Scores`}
			onClose={props.closeModal}
			isAttemptsLoading={props.attempts.isFetching}
			attempts={props.attempts.items}
		/>
	)
}

const renderModalDialog = props => {
	let dialog
	let title
	switch (props.dialog) {
		case 'module-more':
			title = 'Module Options'
			dialog = renderOptionsDialog(props)
			break

		case 'module-permissions':
			title = 'Module Access'
			dialog = renderPermissionsDialog(props)
			break

		case 'module-version-history':
			title = 'Module Version History'
			dialog = renderVersionHistoryDialog(props)
			break

		case 'module-assessment-score-data':
			title = 'Module Assessment Score Data'
			dialog = renderAssessmentScoreDataDialog(props)
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

const getModuleCount = modules => {
	if (modules.length === 1) {
		return '1 Module Selected: '
	} else {
		return `${modules.length} Modules Selected:`
	}
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

function Dashboard(props) {
	const [sortOrder, setSortOrder] = useState(props.sortOrder)
	const [newModuleId, setNewModuleId] = useState(null)
	const [lastSelectedIndex, setLastSelectedIndex] = useState(0)
	const [isLoading, setIsLoading] = useState(false)

	const moduleList = props.filteredModules ? props.filteredModules : props.myModules

	const onKeyUp = e => {
		if (e.key === 'Escape' && props.multiSelectMode && props.deselectModules) {
			props.deselectModules(props.selectedModules)
		}
	}

	const handleCreateNewModule = useTutorial => {
		setIsLoading(true)

		props.createNewModule(useTutorial).then(data => {
			setIsLoading(false)
			data.payload.value.sort(getSortMethod('newest'))
			setNewModuleId(data.payload.value[0].draftId)
		})
	}

	const handleSelectModule = (event, draftId, index) => {
		if (event.shiftKey && lastSelectedIndex !== index) {
			// Accommodates for group selecting backwards in the list and prevents duplicate selections
			const [startIdx, endIdx] =
				lastSelectedIndex < index ? [lastSelectedIndex, index + 1] : [index, lastSelectedIndex + 1]
			const idList = moduleList.map(m => m.draftId)
			props.selectModules(
				idList.slice(startIdx, endIdx).filter(id => !props.selectedModules.includes(id))
			)
		} else {
			props.selectedModules.includes(draftId)
				? props.deselectModules([draftId])
				: props.selectModules([draftId])
		}

		setLastSelectedIndex(index)
	}

	const deleteModules = draftIds => {
		// eslint-disable-next-line no-alert, no-undef
		const response = prompt(
			`Are you sure you want to DELETE these ${draftIds.length} selected modules? Type 'DELETE' to confirm.`
		)
		if (response !== 'DELETE') return
		props.bulkDeleteModules(draftIds)
	}

	// Set a cookie when sortOrder changes on the client
	// can't undefine document to test this 'else' case without breaking everything - maybe later
	/* istanbul ignore else */
	if (typeof document !== 'undefined') {
		useEffect(() => {
			const expires = new Date()
			expires.setFullYear(expires.getFullYear() + 1)
			document.cookie = `sortOrder=${sortOrder}; expires=${expires.toUTCString()}; path=/dashboard`
			setLastSelectedIndex(0)
		}, [sortOrder])
	}

	useEffect(() => {
		// Reset last selected index when leaving multi-select mode
		if (!props.multiSelectMode) setLastSelectedIndex(0)
	}, [props.multiSelectMode])

	useEffect(() => {
		document.addEventListener('keyup', onKeyUp)
		return () => {
			document.removeEventListener('keyup', onKeyUp)
		}
	}, [onKeyUp])

	let itemCollectionMultiWrapperClassName =
		'repository--item-list--collection--item--multi-wrapper '
	itemCollectionMultiWrapperClassName += isLoading ? 'fade' : ''

	return (
		<span id="dashboard-root">
			<RepositoryNav
				userId={props.currentUser.id}
				userPerms={props.currentUser.perms}
				avatarUrl={props.currentUser.avatarUrl}
				displayName={`${props.currentUser.firstName} ${props.currentUser.lastName}`}
				noticeCount={0}
			/>
			<RepositoryBanner title={props.title} className="default-bg" facts={props.facts} />
			<div className="repository--section-wrapper">
				<section className="repository--main-content">
					{props.multiSelectMode ? (
						<div className="repository--main-content--control-bar is-multi-select-mode">
							<span className="module-count">{getModuleCount(props.selectedModules)}</span>
							<Button
								className="multi-select secondary-button dangerous-button"
								onClick={() => deleteModules(props.selectedModules)}
							>
								Delete All
							</Button>
							<Button
								className="close-button"
								onClick={() => props.deselectModules(props.selectedModules)}
							>
								×
							</Button>
						</div>
					) : (
						<div className="repository--main-content--control-bar is-not-multi-select-mode">
							<MultiButton title="New Module">
								<Button onClick={() => handleCreateNewModule(false)}>New Module</Button>
								<Button onClick={() => handleCreateNewModule(true)}>New Tutorial</Button>
								<Button onClick={props.importModuleFile}>Upload...</Button>
							</MultiButton>
							<Search
								value={props.moduleSearchString}
								placeholder="Filter..."
								onChange={props.filterModules}
							/>
						</div>
					)}
					<div className="repository--main-content--title">
						<span>My Modules</span>
						<div className="repository--main-content--sort">
							<span>Sort</span>
							<select value={sortOrder} onChange={event => setSortOrder(event.target.value)}>
								<option value="newest">Newest</option>
								<option value="alphabetical">Alphabetical</option>
								<option value="last updated">Last updated</option>
							</select>
						</div>
					</div>
					<div className="repository--item-list--collection">
						<div className="repository--item-list--collection--item-wrapper">
							<div className="repository--item-list--row">
								{isLoading && <Spinner color="#6714bd" />}
								<div className={itemCollectionMultiWrapperClassName}>
									{moduleList.sort(getSortMethod(sortOrder)).map((draft, index) => (
										<Module
											isNew={draft.draftId === newModuleId}
											isSelected={props.selectedModules.includes(draft.draftId)}
											isMultiSelectMode={props.multiSelectMode}
											onSelect={e => handleSelectModule(e, draft.draftId, index)}
											key={draft.draftId}
											hasMenu={true}
											{...draft}
										/>
									))}
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
			{props.dialog ? renderModalDialog(props) : null}
		</span>
	)
}

module.exports = Dashboard
