require('./module-manage-collections-dialog.scss')

const whitespaceRegex = /\s+/g

const React = require('react')
const { useEffect, useState } = require('react')
const ModuleImage = require('./module-image')
const Button = require('./button')
const Checkbox = require('./checkbox')
const Search = require('./search')

const ModuleManageCollectionsDialog = props => {
	const [filterString, setfilterString] = useState('')

	// Load collections this module is in on the initial render
	useEffect(() => {
		props.loadModuleCollections(props.draftId)
	}, [])

	const addCollection = collectionId => props.moduleAddToCollection(props.draftId, collectionId)

	const removeCollection = collectionId =>
		props.moduleRemoveFromCollection(props.draftId, collectionId)

	const filterCollections = collection => {
		const searchString = ('' + filterString).replace(whitespaceRegex, '').toLowerCase()
		if (!searchString) return true

		return (collection.title || '')
			.replace(whitespaceRegex, '')
			.toLowerCase()
			.includes(searchString)
	}

	const renderModuleCollections = () => {
		if (!props.collections) return null

		return props.collections.filter(filterCollections).map(collection => {
			const checkIfInCollection = draftCollection => collection.id === draftCollection.id

			const moduleInCollection =
				props.draftCollections && props.draftCollections.some(checkIfInCollection)

			const collectionClickHandler = moduleInCollection ? removeCollection : addCollection
			const handleCollectionClick = () => {
				collectionClickHandler(collection.id)
			}

			return (
				<li
					key={collection.id}
					className="collection-list--collection"
					onClick={handleCollectionClick}
				>
					<Checkbox checked={moduleInCollection} />
					<span>{collection.title}</span>
				</li>
			)
		})
	}

	return (
		<div className="module-manage-collections-dialog">
			<div className="top-bar">
				<ModuleImage id={props.draftId} />
				<div className="module-title">{props.title}</div>
				<Button ariaLabel="Close" className="close-button" onClick={props.onClose}>
					×
				</Button>
			</div>
			<div className="wrapper">
				<h1 className="title">Manage Collections</h1>
				<div className="sub-title">
					Add this module to or remove this module from private collections
				</div>
				<Search placeholder="Filter..." onChange={setfilterString} />
			</div>
			<div className="collection-list-wrapper">
				<ul className="collection-list">{renderModuleCollections()}</ul>
			</div>
			<div className="wrapper">
				<Button className="done-button secondary-button" onClick={props.onClose}>
					Done
				</Button>
			</div>
		</div>
	)
}

module.exports = ModuleManageCollectionsDialog
