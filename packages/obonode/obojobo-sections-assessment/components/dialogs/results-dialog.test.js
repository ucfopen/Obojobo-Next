/* eslint-disable react/display-name */
import React from 'react'
import renderer from 'react-test-renderer'
import ResultsDialog from './results-dialog'

jest.mock('Common', () => ({
	components: {
		modal: {
			Dialog: props => <div {...props}></div>
		}
	}
}))

jest.mock('../assessment-score-report-view', () => props => <div {...props}></div>)

describe('ResultsDialog', () => {
	beforeEach(() => {
		jest.resetAllMocks()
	})

	test('renders', () => {
		const props = {
			label: 'mock-label',
			attemptNumber: 'mock-attempt-number',
			scoreReport: 'mock-score-report',
			onShowClick: 'mock-on-show-click'
		}
		const component = renderer.create(<ResultsDialog {...props} />)
		const tree = component.toJSON()

		expect(tree).toMatchInlineSnapshot(`
		<div
		  buttons={
		    Array [
		      Object {
		        "default": true,
		        "onClick": "mock-on-show-click",
		        "value": "Show mock-label Overview",
		      },
		    ]
		  }
		  centered={true}
		  modalClassName="obojobo-draft--sections--assessment--results-modal"
		  title="Attempt mock-attempt-number Results"
		  width="35rem"
		>
		  <div
		    report="mock-score-report"
		  />
		</div>
	`)
	})
})
