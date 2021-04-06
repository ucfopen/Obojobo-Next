const fs = require('fs')
const jsonToXmlParser = require('../json-to-xml-parser')
global.window.open = jest.fn()
global.window.katex = {
	renderToString: jest
		.fn()
		.mockImplementation(
			(input, options = {}) =>
				`mock-katex-render-for-${input}-with-options-${JSON.stringify(options)}`
		)
}

describe('JSON to XML Parser', () => {
	const basePath = `${__dirname}/sample-node-json/`
	const sampleJsonFiles = fs.readdirSync(basePath).filter(s => s.includes('.json'))
	// creates array of arrays for test.each
	// [[file1], [file2]]
	const cases = sampleJsonFiles.map(file => [file])

	test.each(cases)('Converts %s to xml', file => {
		const json = require(`${basePath}${file}`)
		expect(jsonToXmlParser(json)).toMatchSnapshot()
	})
})
