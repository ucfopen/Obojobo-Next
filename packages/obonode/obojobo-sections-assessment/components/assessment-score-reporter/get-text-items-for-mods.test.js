import getTextItemsForMods from './get-text-items-for-mods'

describe('getTextItemsForMods', () => {
	test('returns empty array when no mods', () => {
		expect(getTextItemsForMods([], 3)).toEqual([])
	})

	test('returns an array of text items for each mod', () => {
		expect(
			getTextItemsForMods(
				[
					{
						attemptCondition: '1',
						reward: 1
					},
					{
						attemptCondition: '[2,3]',
						reward: -2
					},
					{
						attemptCondition: ' ( 1 , 3 ) ',
						reward: 3
					},
					{
						attemptCondition: '	(	1	,	3	]	',
						reward: -4
					},
					{
						attemptCondition: '[1,3)',
						reward: 5
					},
					{
						attemptCondition: '  $last_attempt  ',
						reward: -6
					},
					{
						attemptCondition: '[1,$last_attempt]',
						reward: 7
					}
				],
				3
			)
		).toEqual([
			{
				type: 'extra-credit',
				text: 'Passed on first attempt',
				value: '1'
			},
			{
				type: 'penalty',
				text: 'Passed on attempts 2 to 3',
				value: '2'
			},
			{
				type: 'extra-credit',
				text: 'Passed on attempt\u00a02',
				value: '3'
			},
			{
				type: 'penalty',
				text: 'Passed on attempts 2 to 3',
				value: '4'
			},
			{
				type: 'extra-credit',
				text: 'Passed on attempts 1 to 2',
				value: '5'
			},
			{
				type: 'penalty',
				text: 'Passed on last attempt',
				value: '6'
			},
			{
				type: 'extra-credit',
				text: 'Passed on attempts 1 to 3',
				value: '7'
			}
		])
	})
})
