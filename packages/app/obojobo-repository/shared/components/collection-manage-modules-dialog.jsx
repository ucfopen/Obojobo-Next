require('./collection-manage-modules-dialog.scss')

const React = require('react')
const { useEffect, useState } = require('react')
const ReactModal = require('react-modal')
const Button = require('./button')
const ModuleSearchDialog = require('./module-search-dialog-hoc')
const CollectionImage = require('./collection-image')
const CollectionModuleListItem = require('./collection-module-list-item')

const CollectionManageModulesDialog = props => {
	const [modulePickerOpen, setModulePickerOpen] = useState(false)

	// Load the modules in this collection on the initial render
	useEffect(() => {
		props.loadCollectionModules(props.collection.id)
	}, [])

	const openModulePicker = () => {
		setModulePickerOpen(true)
	}

	const closeModulePicker = () => {
		setModulePickerOpen(false)
	}

	const addModule = draftId => {
		props.collectionAddModule(draftId, props.collection.id)
		closeModulePicker()
	}

	const removeModule = draftId => {
		props.collectionRemoveModule(draftId, props.collection.id)
	}

	let searchModalRender = null

	if (modulePickerOpen) {
		searchModalRender = (
			<ReactModal
				isOpen={true}
				contentLabel="Module Search"
				className="repository--modal"
				overlayClassName="repository--modal-overlay"
				onRequestClose={closeModulePicker}
			>
				<ModuleSearchDialog
					collectionId={props.collection.id}
					collectionModules={props.collectionModules}
					onClose={closeModulePicker}
					onSelectModule={addModule}
				/>
			</ReactModal>
		)
	}

	let modulesRender = null

	if (props.collectionModules) {
		modulesRender = props.collectionModules.map(module => (
			<CollectionModuleListItem key={module.draftId} {...module}>
				<Button
					ariaLabel="Close"
					className="close-button"
					onClick={() => {
						removeModule(module.draftId)
					}}
				>
					×
				</Button>
			</CollectionModuleListItem>
		))
	}

	return (
		<div className="collection-manage-modules-dialog">
			<div className="top-bar">
				<CollectionImage id={props.collection.id} />
				<div className="collection-title">{props.collection.title}</div>
				<Button ariaLabel="Close" className="close-button" onClick={props.onClose}>
					×
				</Button>
			</div>
			<div className="wrapper manage-modules-wrapper">
				<h1 className="title">Manage Modules</h1>
				<div className="sub-title">Add modules to or remove modules from this collection</div>
				<Button className="add-module-button" onClick={openModulePicker}>
					Add Module
				</Button>
			</div>

			<ul className="module-list">{modulesRender}</ul>

			<div className="wrapper module-search-wrapper">
				{searchModalRender}
				<Button className="done-button secondary-button" onClick={props.onClose}>
					Done
				</Button>
			</div>
		</div>
	)
}

module.exports = CollectionManageModulesDialog
