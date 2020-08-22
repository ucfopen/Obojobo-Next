const fs = require('fs')
const xmlToDraftObject = require('../xml-to-draft-object')
const jsonToXml = require('obojobo-document-json-parser/json-to-xml-parser')
const filterFileType = files =>
	files.filter(f => f.endsWith('.xml')).map(f => f.substring(0, f.length - 4))

const nodes = filterFileType(fs.readdirSync(`${__dirname}/obo_node_xml/`))
const shorthandNodes = filterFileType(fs.readdirSync(`${__dirname}/obo_node_shorthand/`))

describe('XMLtoObject', () => {
	test('style tags dont break markup', () => {
		const xml = `<?xml version="1.0" encoding="utf-8"?>
<ObojoboDraftDoc>
	<Module title="Title" id="03c9a437-d3ee-4607-90e9-8f229c29ffc0">
		<Content id="bf2755c3-7704-4caf-8f17-510843f5392f">
			<Page title="page" id="c4c1f135-7fab-468c-a33b-3e7469053689">
				<Text id="dd848093-f356-4083-8712-7af4f61c443e">
					<textGroup>
						<t indent="0">This <code>Add</code> <code>Assessment</code></t>
					</textGroup>
				</Text>
			</Page>
		</Content>
	</Module>
</ObojoboDraftDoc>`.replace(/\n/g, '\r\n')

		const xmlToJSON = xmlToDraftObject(xml)
		const backToXML = jsonToXml(xmlToJSON)

		expect(xmlToJSON).toMatchInlineSnapshot(`
		Object {
		  "children": Array [
		    Object {
		      "children": Array [
		        Object {
		          "children": Array [
		            Object {
		              "children": Array [],
		              "content": Object {
		                "textGroup": Array [
		                  Object {
		                    "data": Object {
		                      "indent": "0",
		                    },
		                    "text": Object {
		                      "styleList": Array [
		                        Object {
		                          "data": Object {},
		                          "end": 8,
		                          "start": 5,
		                          "type": "monospace",
		                        },
		                        Object {
		                          "data": Object {},
		                          "end": 19,
		                          "start": 9,
		                          "type": "monospace",
		                        },
		                      ],
		                      "value": "This Add Assessment",
		                    },
		                  },
		                ],
		              },
		              "id": "dd848093-f356-4083-8712-7af4f61c443e",
		              "type": "ObojoboDraft.Chunks.Text",
		            },
		          ],
		          "content": Object {
		            "title": "page",
		          },
		          "id": "c4c1f135-7fab-468c-a33b-3e7469053689",
		          "type": "ObojoboDraft.Pages.Page",
		        },
		      ],
		      "content": Object {},
		      "id": "bf2755c3-7704-4caf-8f17-510843f5392f",
		      "type": "ObojoboDraft.Sections.Content",
		    },
		  ],
		  "content": Object {
		    "title": "Title",
		  },
		  "id": "03c9a437-d3ee-4607-90e9-8f229c29ffc0",
		  "type": "ObojoboDraft.Modules.Module",
		}
	`)
		expect(backToXML).toEqual(xml)
	})

	for (const node of nodes) {
		test(`Converted ${node} xml matches object`, () => {
			const xml = fs.readFileSync(`${__dirname}/obo_node_xml/${node}.xml`, 'utf8')
			expect(xmlToDraftObject(xml)).toMatchSnapshot()

			if (shorthandNodes.includes(`${node}`)) {
				const xmlShorthand = fs.readFileSync(`${__dirname}/obo_node_shorthand/${node}.xml`)
				expect(xmlToDraftObject(xml)).toEqual(xmlToDraftObject(xmlShorthand))
			}
		})
	}

	for (const node of shorthandNodes) {
		test(`Converted ${node} xml matches converted shorthand notation`, () => {
			const xml = fs.readFileSync(`${__dirname}/obo_node_xml/${node}.xml`, 'utf8')
			const xmlShorthand = fs.readFileSync(`${__dirname}/obo_node_shorthand/${node}.xml`)
			expect(xmlToDraftObject(xml)).toEqual(xmlToDraftObject(xmlShorthand))
		})
	}
})
