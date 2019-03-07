const LIST_LEVEL_NODE = 'ObojoboDraft.Chunks.List.Level'

const unorderedBullets = ['disc', 'circle', 'square']
const orderedBullets = ['decimal', 'upper-alpha', 'upper-roman', 'lower-alpha', 'lower-roman']

const unwrapLevel = (event, change) => {
	event.preventDefault()
	let bullet = 'disc'
	let type = 'unordered'

	// get the bullet and type of the closest parent level
	change.value.blocks.forEach(block => {
		const level = change.value.document.getClosest(
			block.key,
			parent => parent.type === LIST_LEVEL_NODE
		)
		const content = level.data.get('content')
		bullet = content.bulletStyle
		type = content.type
	})

	// get the proper bullet for the next level
	const bulletList = type === 'unordered' ? unorderedBullets : orderedBullets
	const nextBullet = bulletList[(bulletList.indexOf(bullet) + 1) % bulletList.length]

	// add in the new level around the lines
	change.wrapBlock({
		type: LIST_LEVEL_NODE,
		data: { content: { type: type, bulletStyle: nextBullet } }
	})
	return true
}

export default unwrapLevel
