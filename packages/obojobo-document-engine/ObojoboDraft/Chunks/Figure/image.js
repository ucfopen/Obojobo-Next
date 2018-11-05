import './image.scss'

import React from 'react'

const Image = props => {
	let imgStyles
	const data = props.chunk.modelState

	if (!data.url) {
		return <div className="img-placeholder" />
	}

	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
	const isUrlUUID = uuidRegex.test(data.url)
	let imgEndpoint
	let src

	if (isUrlUUID) {
		// Endpoint: /api/media/:mediaId/:size
		if (data.height || data.width) {
			imgEndpoint = `/api/media/${data.url}/${data.width || '*'}x${data.height || '*'}`
		} else {
			imgEndpoint = `/api/media/${data.url}/${data.size}`
		}
		src = imgEndpoint
	} else {
		src = data.url
	}

	switch (data.size) {
		case 'small':
		case 'medium':
		case 'large':
			return <img src={src} unselectable="on" alt={data.alt} />
		case 'custom':
			imgStyles = {}

			if (data.width) {
				imgStyles.width = data.width + 'px'
			}

			if (data.height) {
				imgStyles.height = data.height + 'px'
			}

			return <img src={src} unselectable="on" alt={data.alt} style={imgStyles} />
	}
}

export default Image
