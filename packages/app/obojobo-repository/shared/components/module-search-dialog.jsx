require('./module-search-dialog.scss')

const React = require('react')
const { useEffect } = require('react')
const Button = require('./button')
const Search = require('./search')
const CollectionModuleListItem = require('./collection-module-list-item')

const ModuleSearchDialog = ({
	collectionId,
	searchModules = [],
	collectionModules = [],
	clearModuleSearchResults,
	onSelectModule,
	onSearchChange,
	onClose
}) => {
	// clear results on initial render
	useEffect(() => {
		clearModuleSearchResults()
	}, [])

	const renderModuleList = () => {
		return searchModules.map(module => {
			let buttonRender = (
				<Button
					className="select-button"
					onClick={() => {
						onSelectModule(module.draftId)
					}}
				>
					Select
				</Button>
			)
			let alreadyInCollection = false

			if (collectionModules.some(m => module.draftId === m.draftId)) {
				buttonRender = null
				alreadyInCollection = true
			}

			return (
				<CollectionModuleListItem
					key={module.draftId}
					{...module}
					alreadyInCollection={alreadyInCollection}
				>
					{buttonRender}
				</CollectionModuleListItem>
			)
		})
	}

	return (
		<div className="module-search-dialog">
			<div className="wrapper">
				<Button className="close-button" ariaLabel="Close" onClick={onClose}>
					×
				</Button>
				<h1 className="title">Find Modules to Add</h1>
				<Search
					onChange={() => {
						onSearchChange(searchString, collectionId)
					}}
					focusOnMount={true}
					placeholder="Search..."
				/>
			</div>
			<div className="module-list-wrapper">
				<ul className="module-list">{renderModuleList()}</ul>
			</div>
		</div>
	)
}

module.exports = ModuleSearchDialog
