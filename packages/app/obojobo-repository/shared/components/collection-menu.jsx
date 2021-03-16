require('./collection-menu.scss')

const React = require('react')
const Button = require('./button')
const ButtonLink = require('./button-link')
const short = require('short-uuid')

const CollectionMenu = props => {
	const onAddModule = () => {
		props.showCollectionManageModules(props.collection)
	}

	const onRename = () => {
		props.showCollectionRename(props.collection)
	}

	const onDelete = () => {
		//eslint-disable-next-line no-alert, no-undef
		const response = confirm(
			`Delete collection "${props.collection.title}"? Modules in this collection will not be deleted.`
		)
		if (!response) return
		props.deleteCollection(props.collection)
	}

	const collectionTitleToUrl = encodeURI(props.collection.title.replace(/\s+/g, '-').toLowerCase())
	const translator = short()
	const collectionIdToUrl = translator.fromUUID(props.collection.id)

	return (
		<div className="repository--module-icon--menu-wrapper">
			<div className={`repository--module-icon--menu ${props.className || ''}`}>
				<ButtonLink
					className="collection-link-button"
					url={`/collections/${collectionTitleToUrl}-${collectionIdToUrl}`}
					target="_blank"
				>
					View Collection
				</ButtonLink>
				<Button onClick={onAddModule} className="manage-modules">
					Manage Modules
				</Button>
				<Button onClick={onRename} className="rename">
					Rename
				</Button>
				<hr />
				<Button onClick={onDelete} className="dangerous-button">
					Delete
				</Button>
			</div>
		</div>
	)
}

module.exports = CollectionMenu
