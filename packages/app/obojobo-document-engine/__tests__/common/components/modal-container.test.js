import React from 'react'
import renderer from 'react-test-renderer'

import ModalContainer from '../../../src/scripts/common/components/modal-container'

describe('ModalContainer', () => {
	test('ModalContainer component', () => {
		const component = renderer.create(
			<ModalContainer assessmentId="mock-assessment-id">
				<div className="mock-modal-content"></div>
			</ModalContainer>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})
})
