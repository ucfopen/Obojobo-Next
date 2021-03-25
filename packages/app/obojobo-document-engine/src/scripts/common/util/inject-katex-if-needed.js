import insertDomTag from './insert-dom-tag'

const injectKatexIfNeeded = async ({ value: draftModel }) => {
	// DETECT LATEX USAGE
	// LATEX can be in seen in 2 places
	// HTML allows div with a classname of 'latex' to render latex
	// AND in text nodes with a styleList item of type _latex
	// The second can be matched against `"type":"_latex"` without many false positives
	// However, the html node's classname will generate more false positives

	if (window.katex) {
		return draftModel
	}

	const stringModel = JSON.stringify(draftModel)

	if (stringModel.includes('latex')) {
		const jsProps = {
			src: 'https://unpkg.com/katex@0.12.0/dist/katex.min.js'
		}
		const cssProps = {
			rel: 'stylesheet',
			type: 'text/css',
			href: 'https://unpkg.com/katex@0.12.0/dist/katex.min.css'
		}
		insertDomTag(jsProps, 'script')
		insertDomTag(cssProps, 'link')

		await new Promise((resolve, reject) => {
			const timeout = 15000
			const intervalTime = 20
			let timer = 0
			const latexCheckInterval = setInterval(() => {
				timer += intervalTime
				if (window.katex) {
					clearInterval(latexCheckInterval)
					return resolve()
				}
				if (timer > timeout) {
					clearInterval(latexCheckInterval)
					return reject('Timed out loading katex library')
				}
			}, intervalTime)
		})
	}

	return draftModel
}

export default injectKatexIfNeeded
