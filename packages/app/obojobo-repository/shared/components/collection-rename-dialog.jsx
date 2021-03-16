require('./collection-rename-dialog.scss')

const React = require('react')
const { useState } = require('react')
const Button = require('./button')

const CollectionOptionsDialog = props => {
	const [collectionTitle, setCollectionTitle] = useState(props.collection.title)

	const onInputChange = event => {
		setCollectionTitle(event.target.value)
	}

	const onAccept = () => {
		props.onAccept(props.collection.id, collectionTitle)
		props.onClose()
	}

	return (
		<div className="collection-rename-dialog">
			<div className="top-bar">
				<div className="collection-title">{props.title}</div>
				<Button className="close-button" ariaLabel="Close" onClick={props.onClose}>
					×
				</Button>
			</div>
			<div className="wrapper">
				<input
					className="collection-rename-input"
					value={collectionTitle}
					onChange={onInputChange}
					aria-label="Rename Collection"
				/>
				<Button className="done-button secondary-button" onClick={onAccept}>
					Accept
				</Button>
			</div>
		</div>
	)
}

module.exports = CollectionOptionsDialog
