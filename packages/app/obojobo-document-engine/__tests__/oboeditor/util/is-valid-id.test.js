import isValidId from 'src/scripts/oboeditor/util/is-valid-id'

describe('Validate ID', () => {
	test.each`
		input          | output
		${'mock-id'}   | ${true}
		${'mock_id'}   | ${true}
		${'mock:id'}   | ${true}
		${'mock.id'}   | ${true}
		${'mock+id'}   | ${false}
		${'mock=id'}   | ${false}
		${'abc123'}    | ${true}
		${'ABC123'}    | ${true}
		${'"mock-id"'} | ${false}
		${'/mock-id/'} | ${false}
		${'[mock-id]'} | ${false}
	`('isValidId("$input") = "$output"', ({ input, output }) => {
		expect(isValidId(input)).toBe(output)
	})
})
