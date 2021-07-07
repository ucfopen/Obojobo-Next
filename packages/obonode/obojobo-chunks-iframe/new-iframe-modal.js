import './new-iframe-modal.scss'

import React, { useEffect, useState, useRef } from 'react'
import Common from 'Common'
import IFrameContentTypes from './iframe-content-types'
const { useDebouncedCallback } = require('use-debounce')
const { SimpleDialog } = Common.components.modal
import { parseURLOrEmbedCode } from 'obojobo-document-engine/src/scripts/oboeditor/util/url-embed-code-check'

const SOURCE_CHANGE_DEBOUNCE_MS = 500
const IFRAME_NODE = 'ObojoboDraft.Chunks.IFrame'

const NewIframeModal = props => {
	const [content, setContent] = useState({
		src: '',
		width: 640,
		height: 480,
		srcToLoad: '',
		contentType: IFrameContentTypes.MEDIA
	})
	const [iframeLoaded, setIframeLoaded] = useState(true)
	const [openPreviewNotWorking, setOpenPreviewNotWorking] = useState(false)
	const inputRef = useRef(null)

	useEffect(() => {
		setContent({
			...content,
			...props.content
		})

		focusOnFirstElement()
	}, [])

	const focusOnFirstElement = () => inputRef.current.focus()

	const debounceOnSourceChange = useDebouncedCallback(src => {
		// Transform to self-calling function
		handleSourceToLoad(src)
	}, SOURCE_CHANGE_DEBOUNCE_MS)

	const handleSourceToLoad = src => {
		setContent({ ...content, srcToLoad: src })
	}

	const handleSourceChange = event => {
		let src = event.target.value
		let width,
			height = ''

		if (!parseURLOrEmbedCode(src, IFRAME_NODE)) {
			setContent({ ...content, src })
			setIframeLoaded(false)
			debounceOnSourceChange(src)
			return
		}

		const contentType = src.includes('<iframe')
			? IFrameContentTypes.MEDIA
			: IFrameContentTypes.WEBPAGE

		if (contentType === IFrameContentTypes.MEDIA) {
			// Extracting iframe's src address (if detected content type is MEDIA)
			src = src
				.split('src="')
				.pop()
				.split('"')[0]

			// Extracting width and height
			width = src
				.split('width="')
				.pop()
				.split('"')[0]
			height = src
				.split('height="')
				.pop()
				.split('"')[0]
		}

		setContent({ ...content, src, contentType, width, height })
		setIframeLoaded(true)
		debounceOnSourceChange(src)
	}

	const openPreviewNotWorkingSection = () => setOpenPreviewNotWorking(true)

	const previewContent = (
		<div className="preview-with-iframe">
			<iframe src={content.srcToLoad}></iframe>
			<section>
				<p>Does the preview look good?</p>
				{openPreviewNotWorking ? (
					<div className="preview-not-working">
						If the preview above is not what you expected, keep in mind that some pages inside your
						IFrame may restrict their content, thus not allowing them to be shown within Obojobo.
						Also, if you are trying to embed media instead of an IFrame, make sure to paste your
						IFrame&apos;s embed code (starting with &lt;iframe...) and not only the regular URL.
					</div>
				) : (
					<button onClick={openPreviewNotWorkingSection}>No, the preview isn&apos;t working</button>
				)}
			</section>
		</div>
	)

	return (
		<SimpleDialog
			cancelOrCustomYes
			customYes="Preview is good - Continue..."
			title="New Embedded IFrame"
			onConfirm={() => props.onConfirm(content)}
			onCancel={props.onCancel}
			focusOnFirstElement={focusOnFirstElement}
		>
			<div className="new-iframe-modal">
				<header>
					<p>Paste either an iframe embed code or a URL to embed:</p>
					<input
						type="text"
						placeholder='<iframe src="https://example.com"/> or "https://example.com"'
						ref={inputRef}
						value={content.src || ''}
						onChange={handleSourceChange}
					/>
				</header>
				<div className="preview">
					<p>Embedded preview:</p>
					{content.src && iframeLoaded ? (
						previewContent
					) : (
						<div className="no-preview">
							{iframeLoaded || content.src === '' ? (
								<span>Paste a link or embed code above to see the preview</span>
							) : (
								<span>Make sure you are using a valid URL or an IFrame embed code</span>
							)}
						</div>
					)}
				</div>
			</div>
		</SimpleDialog>
	)
}

export default NewIframeModal
