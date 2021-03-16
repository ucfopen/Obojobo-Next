require('./collection.scss')

const React = require('react')
const { useState } = require('react')
const CollectionImage = require('./collection-image')
const CollectionMenu = require('./collection-menu-hoc')
const MenuControlButton = require('./menu-control-button')
const short = require('short-uuid')

const Collection = props => {
	let timeOutId
	const [isMenuOpen, setMenuOpen] = useState(false)

	const onToggleMenu = e => {
		setMenuOpen(!isMenuOpen)
		e.preventDefault() // block the event from bubbling out to the parent href
	}

	const onMouseLeaveHandler = () => setMenuOpen(false)

	// Handle keyboard focus
	const onBlurHandler = () => {
		timeOutId = setTimeout(() => {
			setMenuOpen(false)
		})
	}
	const onFocusHandler = () => {
		clearTimeout(timeOutId)
	}

	const collectionTitleToUrl = encodeURI(props.title.replace(/\s+/g, '-').toLowerCase())
	const translator = short()
	const collectionIdToUrl = translator.fromUUID(props.id)

	let mainRender = (
		<a href={`/collections/${collectionTitleToUrl}-${collectionIdToUrl}`}>
			<CollectionImage id={props.id} />
			<div className="repository--collection-icon--title">{props.title}</div>
		</a>
	)
	if (props.hasMenu) {
		mainRender = (
			<button onClick={onToggleMenu}>
				<CollectionImage id={props.id} />
				<MenuControlButton className="repository--collection-icon--menu-control-button" />
				<div className="repository--collection-icon--title">{props.title}</div>
			</button>
		)
	}

	let menuRender = null
	if (isMenuOpen) {
		menuRender = null
		menuRender = <CollectionMenu collection={props} />
	}

	return (
		<div
			onMouseLeave={onMouseLeaveHandler}
			className={'repository--collection-icon ' + (isMenuOpen ? 'is-open' : 'is-not-open')}
			onBlur={onBlurHandler}
			onFocus={onFocusHandler}
		>
			{mainRender}
			{menuRender}
			{props.children}
		</div>
	)
}

module.exports = Collection
