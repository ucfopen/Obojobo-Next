/* eslint-disable react/display-name */

import React from 'react'
import renderer from 'react-test-renderer'

import UnfinishedAttemptDialog from './unfinished-attempt-dialog'

jest.mock('Common', () => ({
	components: {
		modal: {
			SimpleDialog: props => <div {...props}></div>
		}
	}
}))

describe('UnfinishedAttemptDialog', () => {
	beforeEach(() => {
		jest.resetAllMocks()
	})

	test('renders', () => {
		const onConfirm = jest.fn()
		const component = renderer.create(<UnfinishedAttemptDialog onConfirm={onConfirm} />)
		const tree = component.toJSON()

		expect(tree).toMatchInlineSnapshot(`
		<div
		  ok={true}
		  onConfirm={[MockFunction]}
		  title="Resume Attempt"
		>
		  <p>
		    It looks like you were in the middle of an attempt. We'll resume where you left off.
		  </p>
		</div>
	`)
	})
})
