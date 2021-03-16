require('./module.scss')

const React = require('react')
const { useState } = require('react')
const ModuleImage = require('./module-image')
const ModuleMenu = require('./module-menu-hoc')
const MenuControlButton = require('./menu-control-button')

const Module = props => {
	let timeOutId
	const [isMenuOpen, setMenuOpen] = useState(false)
	const onCloseMenu = () => setMenuOpen(false)
	const onToggleMenu = e => {
		setMenuOpen(!isMenuOpen)
		e.preventDefault() // block the event from bubbling out to the parent href
	}
	// Handle keyboard focus
	const onBlurHandler = () => {
		timeOutId = setTimeout(() => {
			setMenuOpen(false)
		})
	}
	const onFocusHandler = () => {
		clearTimeout(timeOutId)
	}

	return (
		<div
			onMouseLeave={onCloseMenu}
			className={
				'repository--module-icon ' +
				(isMenuOpen ? 'is-open ' : 'is-not-open ') +
				(props.isNew ? 'is-new' : 'is-not-new')
			}
			onBlur={onBlurHandler}
			onFocus={onFocusHandler}
		>
			{props.hasMenu ? (
				<button onClick={onToggleMenu}>
					<ModuleImage id={props.draftId} />
					<MenuControlButton className="repository--module-icon--menu-control-button" />
					<div className="repository--module-icon--title">{props.title}</div>
				</button>
			) : (
				<a href={`/library/${props.draftId}`}>
					<ModuleImage id={props.draftId} />
					<div className="repository--module-icon--title">{props.title}</div>
				</a>
			)}
			{isMenuOpen ? (
				<ModuleMenu draftId={props.draftId} editor={props.editor} title={props.title} />
			) : null}
			{props.children}
		</div>
	)
}

module.exports = Module
