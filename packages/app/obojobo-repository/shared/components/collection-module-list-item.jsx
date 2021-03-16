require('./collection-module-list-item.scss')

const React = require('react')
const ModuleImage = require('./module-image')

const CollectionModuleListItem = props => {
	const classNames = [
		'module-list-item',
		props.alreadyInCollection ? 'is-already-in-collection' : 'is-not-already-in-collection'
	].join(' ')
	return (
		<li className={classNames}>
			<ModuleImage id={props.draftId} />
			<div className="module-title">{props.title}</div>
			{props.children}
		</li>
	)
}

module.exports = CollectionModuleListItem
