const HASH_TIME_REGEX = /(t=[0-9]+m[0-9]+s$)|(t=[0-9]+s$)|(t=[0-9]+m$)|(t=[0-9]+$)/
const MIN_SEC_TIME_REGEX = /([0-9]+)m([0-9]+)s$/
const MIN_TIME_REGEX = /([0-9]+)m$/
const SEC_TIME_REGEX = /([0-9]+)s$/

const IFRAME_NODE = 'ObojoboDraft.Chunks.IFrame'

const minSecFormatToSeconds = timeString => {
	if (timeString === null) {
		return null
	}

	const minSecMatches = timeString.match(MIN_SEC_TIME_REGEX)
	const minMatches = timeString.match(MIN_TIME_REGEX)
	const secMatches = timeString.match(SEC_TIME_REGEX)

	let mins = 0
	let secs = 0

	if (minSecMatches) {
		mins = parseInt(minSecMatches[1], 10)
		secs = parseInt(minSecMatches[2], 10)
	} else if (minMatches) {
		mins = parseInt(minMatches[1], 10)
	} else if (secMatches) {
		secs = parseInt(secMatches[1], 10)
	} else {
		secs = parseInt(timeString, 10)
	}

	return mins * 60 + secs
}

const getStandardizedURLFromVideoId = videoId => {
	if (!videoId) {
		return ''
	}

	return `${document.location.protocol}//youtu.be/${videoId}`
}

const parseURLOrEmbedCode = (videoIdOrUrlOrEmbedCode, nodeType) => {
	videoIdOrUrlOrEmbedCode = videoIdOrUrlOrEmbedCode.trim()

	let videoId
	let url
	let startString = null
	let endString = null
	let startSeconds = null
	let endSeconds = null

	// Try to parse as embed code and find the URL
	const div = document.createElement('div')
	div.innerHTML = videoIdOrUrlOrEmbedCode
	if (div.children[0] && div.children[0].tagName.toLowerCase() === 'iframe') {
		videoIdOrUrlOrEmbedCode = div.children[0].getAttribute('src')
	}

	// Ensure the URL is prefixed correctly with the protocol, otherwise new URL(...) will fail
	if (videoIdOrUrlOrEmbedCode.indexOf('www.') === 0) {
		videoIdOrUrlOrEmbedCode = document.location.protocol + '//' + videoIdOrUrlOrEmbedCode
	} else if (videoIdOrUrlOrEmbedCode.indexOf('//') === 0) {
		videoIdOrUrlOrEmbedCode = document.location.protocol + videoIdOrUrlOrEmbedCode
	}

	// Try to parse as a URL (IFrame checks should stop here)
	try {
		url = new URL(videoIdOrUrlOrEmbedCode)
		if (
			nodeType === IFRAME_NODE &&
			url &&
			(url.protocol === 'http:' || url.protocol === 'https:')
		) {
			return url
		} else if (nodeType === IFRAME_NODE) {
			return false
		}
	} catch (e) {
		// Assume the user may have pasted a video ID
		videoId = videoIdOrUrlOrEmbedCode
		if (nodeType === IFRAME_NODE) return false
	}

	if (url) {
		const urlTokens = url.pathname.split('/')
		const lastURLToken = urlTokens[urlTokens.length - 1]
		const params = url.searchParams
		const hashToken = url.hash.substr(1)

		// Try to find the various search parameters
		videoId = params.get('v') || params.get('vi') || lastURLToken
		startString = params.get('start') || params.get('t')
		endString = params.get('end')

		// The videoId may have been taken from the end of the URL, in which case we need to chop off
		// any additional info
		if (videoId.indexOf('&') !== -1) {
			videoId = videoId.substr(0, videoId.indexOf('&'))
		}

		// It's possible to specify the start time as a hash
		// (aka http://www.youtube.com/v/dQw4w9WgXcQ#t=1m2s)
		if (startString === null && hashToken.match(HASH_TIME_REGEX)) {
			startString = hashToken.split('=')[1]
		}

		// Standardize the time format to seconds
		startSeconds = minSecFormatToSeconds(startString)
		endSeconds = minSecFormatToSeconds(endString)
	}

	return {
		videoId,
		standardizedVideoUrl: getStandardizedURLFromVideoId(videoId),
		startSeconds,
		endSeconds
	}
}

export { parseURLOrEmbedCode, getStandardizedURLFromVideoId }
