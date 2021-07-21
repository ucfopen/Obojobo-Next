import React from 'react'
import { mount } from 'enzyme'
import renderer from 'react-test-renderer'
import RubricModal from './rubric-modal'
import ModProperties from './mod-properties'
import EditorUtil from 'obojobo-document-engine/src/scripts/oboeditor/util/editor-util'

jest.mock('obojobo-document-engine/src/scripts/oboeditor/util/editor-util')
jest.mock('slate-react')
jest.mock(
	'obojobo-document-engine/src/scripts/oboeditor/components/node/with-slate-wrapper',
	() => item => item
)

describe('Rubric editor modal', () => {
	beforeEach(() => {
		jest.resetAllMocks()
		EditorUtil.getCurrentAssessmentId.mockReturnValue('my-assessment')
	})

	test('Rubric modal renders', () => {
		const component = renderer.create(
			<RubricModal
				element={{
					content: {
						type: 'pass-fail',
						mods: [
							{ reward: 3, attemptCondition: '$last_attempt' },
							{ reward: 3, attemptCondition: '1' },
							{ reward: -3, attemptCondition: '[1,$last_attempt' },
							{ reward: -3, attemptCondition: '[$last_attempt,5]' }
						]
					}
				}}
				editor={{ selection: [0, 0] }}
			/>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('Rubric modal renders with no mods', () => {
		const component = renderer.create(
			<RubricModal
				element={{
					content: {
						type: 'pass-fail'
					}
				}}
				editor={{ selection: [0, 0] }}
			/>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('Rubric modal renders with given values', () => {
		const component = renderer.create(
			<RubricModal
				element={{
					content: {
						passingAttemptScore: 100,
						passedResult: '$attempt_score',
						failedResult: 0,
						unableToPassResult: null,
						mods: [],
						type: 'pass-fail'
					}
				}}
				editor={{ selection: [0, 0] }}
			/>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('Rubric modal calls updateNodeFromState when clicking outside the component', () => {
		const component = mount(
			<RubricModal
				element={{
					content: {
						mods: [],
						type: 'pass-fail'
					}
				}}
				editor={{
					toggleEditable: jest.fn()
				}}
			/>
		)

		const updateNodeFromStateSpy = jest.spyOn(component.instance(), 'updateNodeFromState')

		component.instance().selfRef.current = {
			contains: jest.fn().mockReturnValueOnce(true)
		}

		component.instance().onDocumentMouseDown({ stopPropagation: jest.fn() })
		expect(updateNodeFromStateSpy).not.toHaveBeenCalled()

		component.instance().onDocumentMouseDown({ stopPropagation: jest.fn() })
		expect(updateNodeFromStateSpy).toHaveBeenCalled()
	})

	test('Component adds and removes event listener when mounted, unmount', () => {
		const addSpy = jest.spyOn(document, 'addEventListener')
		const rmSpy = jest.spyOn(document, 'removeEventListener')
		const component = renderer.create(
			<RubricModal
				element={{
					content: { unableToPassType: 'set-value', mods: [] }
				}}
			/>
		)
		expect(addSpy).toHaveBeenCalled()
		expect(rmSpy).not.toHaveBeenCalled()

		component.getInstance().componentWillUnmount()
		expect(rmSpy).toHaveBeenCalled()

		addSpy.mockRestore()
		rmSpy.mockRestore()
	})

	test('Rubric modal changes pass score', () => {
		const component = mount(
			<RubricModal
				element={{
					content: {
						mods: [],
						type: 'pass-fail'
					}
				}}
				editor={{
					toggleEditable: jest.fn()
				}}
			/>
		)

		// To-pass score
		component
			.find({ name: 'passingAttemptScore' })
			.at(0)
			.simulate('focus')
		component
			.find({ name: 'passingAttemptScore' })
			.at(0)
			.simulate('click', { stopPropagation: jest.fn() })
		component
			.find({ name: 'passingAttemptScore' })
			.at(0)
			.simulate('change', { target: { name: 'passingAttemptScore', value: 100 } })
		component
			.find({ name: 'passingAttemptScore' })
			.at(0)
			.simulate('blur')

		expect(component.instance().state.passingAttemptScore).toBe(100)
	})

	test('Rubric modal changes rubric type', () => {
		const component = mount(
			<RubricModal
				element={{
					content: {
						mods: [],
						type: 'pass-fail'
					}
				}}
				editor={{
					toggleEditable: jest.fn()
				}}
			/>
		)

		let input

		input = component
			.find({ name: 'score-type' })
			.at(0)
			.simulate('change', { target: { value: 'highest' } })
		expect(input.html().includes(`value="highest"`)).toBe(true)
		expect(component.instance().state.type).toBe('highest')

		input = component
			.find({ name: 'score-type' })
			.at(1)
			.simulate('change', { target: { value: 'pass-fail' } })
		expect(input.html().includes(`value="pass-fail"`)).toBe(true)
		expect(component.instance().state.type).toBe('pass-fail')
	})

	test('Rubric modal component changes passed score type', () => {
		const component = mount(
			<RubricModal
				element={{
					content: {
						passingAttemptScore: 100,
						passedResult: '$attempt_score',
						failedResult: 0,
						unableToPassResult: null,
						mods: [],
						type: 'pass-fail'
					}
				}}
			/>
		)

		let input

		// If passing, set assessment score to attempt score.
		input = component
			.find('#attempt-score')
			.simulate('change', { target: { value: '$attempt_score' } })
		expect(input.html().includes(`value="$attempt_score"`)).toBe(true)

		// If passing, set assessment score to a specific value.
		input = component
			.find('#specified-value')
			.simulate('change', { target: { value: 'set-value' } })
		expect(input.html().includes(`value="set-value"`)).toBe(true)
	})

	test('Rubric modal renders mod properties section', () => {
		const component = mount(
			<RubricModal
				element={{
					content: {
						passingAttemptScore: 100,
						passedResult: '$attempt_score',
						failedResult: 0,
						unableToPassResult: null,
						mods: [],
						type: 'pass-fail'
					}
				}}
				model={{
					attributes: {
						content: {
							attempts: 3
						}
					}
				}}
			/>
		)

		// Mod properties is open.
		component
			.find('button')
			.at(1)
			.simulate('click')
		expect(component.html().includes(`mod-box`)).toBe(true)

		// Mod properties is closed.
		component
			.find('button')
			.at(1)
			.simulate('click')
		expect(component.html().includes(`mod-box`)).toBe(false)
	})

	test('Rubric modal correctly updates its mod properties', () => {
		const component = mount(
			<RubricModal
				element={{
					content: {
						passingAttemptScore: 100,
						passedResult: '$attempt_score',
						failedResult: 0,
						unableToPassResult: null,
						mods: [],
						type: 'pass-fail'
					}
				}}
				model={{
					attributes: {
						content: {
							attempts: 3
						}
					}
				}}
			/>
		)

		// To render ModProperties
		component
			.find('button')
			.at(1)
			.simulate('click')

		const newMods = [
			{ reward: 3, attemptCondition: '$last_attempt' },
			{ reward: 3, attemptCondition: '1' },
			{ reward: -3, attemptCondition: '[1,$last_attempt' },
			{ reward: -3, attemptCondition: '[$last_attempt,5]' }
		]

		component
			.find(ModProperties)
			.props()
			.updateModProperties(newMods)

		expect(component.instance().state.mods).toBe(newMods)
	})

	test('Rubric modal calls onConfirm from props', () => {
		const onConfirm = jest.fn()

		const component = mount(
			<RubricModal
				element={{
					content: {
						passingAttemptScore: 100,
						passedResult: '$attempt_score',
						failedResult: 0,
						unableToPassResult: null,
						mods: [],
						type: 'pass-fail'
					}
				}}
				onConfirm={onConfirm}
			/>
		)

		component
			.find('button')
			.at(3)
			.simulate('click')
		expect(onConfirm).toHaveBeenCalled()
	})
})
