import RangeModal from './range-modal'
import React from 'react'
import { mount } from 'enzyme'

describe('Range Modal', () => {
	let onConfirm
	beforeEach(() => {
		jest.clearAllMocks()
		onConfirm = jest.fn()
	})

	test('RangeModal component with single number', () => {
		const component = mount(<RangeModal for="100" />)
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('RangeModal component with a range', () => {
		const component = mount(<RangeModal for="[0,100]" />)
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('RangeModal component with a non-inclusive range', () => {
		const component = mount(<RangeModal for="(0,100)" />)
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('RangeModal component with no-score', () => {
		const component = mount(<RangeModal for="no-score" />)
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('RangeModal component with a no range', () => {
		const component = mount(<RangeModal />)
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('getValueFromInput returns the element value based on type', () => {
		expect(
			RangeModal.prototype.getValueFromInput({
				type: 'checkbox',
				checked: 'mock-checked',
				value: 'mock-value'
			})
		).toBe('mock-checked')

		expect(
			RangeModal.prototype.getValueFromInput({
				type: 'radio',
				checked: 'mock-checked',
				value: 'mock-value'
			})
		).toBe('mock-checked')

		expect(
			RangeModal.prototype.getValueFromInput({
				type: 'number',
				checked: 'mock-checked',
				value: 'mock-value'
			})
		).toBe('mock-value')

		expect(
			RangeModal.prototype.getValueFromInput({
				type: 'unrecognized-type',
				checked: 'mock-checked',
				value: 'mock-value'
			})
		).toBe(null)
	})

	test('updateSingleScoreFromEvent calls updateSingleScore', () => {
		const spy = jest.spyOn(RangeModal.prototype, 'updateSingleScore').mockImplementation(jest.fn())

		RangeModal.prototype.updateSingleScoreFromEvent({
			target: { type: 'number', value: 'mock-value' }
		})

		expect(spy).toHaveBeenLastCalledWith('mock-value')

		spy.mockRestore()
	})

	test('updateRangeFromEvent calls updateRange', () => {
		const spy = jest.spyOn(RangeModal.prototype, 'updateRange').mockImplementation(jest.fn())

		RangeModal.prototype.updateRangeFromEvent('propName', {
			target: { type: 'number', value: 'mock-value' }
		})

		expect(spy).toHaveBeenLastCalledWith({ propName: 'mock-value' })

		spy.mockRestore()
	})

	test('updateSingleScore updates the range as expected', () => {
		const spy = jest.spyOn(RangeModal.prototype, 'updateRange').mockImplementation(jest.fn())

		RangeModal.prototype.updateSingleScore('mock-single-score')

		expect(spy).toHaveBeenLastCalledWith({
			min: 'mock-single-score',
			max: 'mock-single-score',
			isMinInclusive: true,
			isMaxInclusive: true
		})

		spy.mockRestore()
	})

	test('generateRangeString generates expected strings', () => {
		expect(
			RangeModal.prototype.generateRangeString({
				min: '50',
				max: '50',
				isMinInclusive: true,
				isMaxInclusive: true
			})
		).toEqual('50')
		expect(
			RangeModal.prototype.generateRangeString({
				min: '50',
				max: '50',
				isMinInclusive: false,
				isMaxInclusive: false
			})
		).toEqual('50')
		expect(
			RangeModal.prototype.generateRangeString({
				min: '50',
				max: '50',
				isMinInclusive: true,
				isMaxInclusive: false
			})
		).toEqual('50')
		expect(
			RangeModal.prototype.generateRangeString({
				min: '50',
				max: '50',
				isMinInclusive: false,
				isMaxInclusive: true
			})
		).toEqual('50')
		expect(
			RangeModal.prototype.generateRangeString({
				min: '0',
				max: '100',
				isMinInclusive: true,
				isMaxInclusive: true
			})
		).toEqual('[0,100]')
		expect(
			RangeModal.prototype.generateRangeString({
				min: '0',
				max: '100',
				isMinInclusive: false,
				isMaxInclusive: true
			})
		).toEqual('(0,100]')
		expect(
			RangeModal.prototype.generateRangeString({
				min: '0',
				max: '100',
				isMinInclusive: true,
				isMaxInclusive: false
			})
		).toEqual('[0,100)')
		expect(
			RangeModal.prototype.generateRangeString({
				min: '0',
				max: '100',
				isMinInclusive: false,
				isMaxInclusive: false
			})
		).toEqual('(0,100)')
	})

	test('updateRange updates state.range, state.error and state.rangeString', () => {
		const component = mount(<RangeModal for="[0,100]" />)
		component.instance().setState({ error: 'mock-error' })
		component.update()

		expect(component.instance().state).toEqual({
			range: {
				min: '0',
				max: '100',
				isMinInclusive: true,
				isMaxInclusive: true
			},
			type: 'range',
			error: 'mock-error'
		})
		component.instance().updateRange({ min: '1', isMinInclusive: false })
		component.update()

		expect(component.instance().state).toEqual({
			range: {
				min: '1',
				max: '100',
				isMinInclusive: false,
				isMaxInclusive: true
			},
			type: 'range',
			error: null
		})
	})

	test('onChangeType updates state with defaults', () => {
		const component = mount(<RangeModal for="(0,100]" />)

		component.instance().onChangeType('single')
		component.update()
		expect(component.instance().state).toEqual({
			range: {
				min: '100',
				max: '100',
				isMinInclusive: true,
				isMaxInclusive: true
			},
			type: 'single',
			error: null
		})

		component.instance().onChangeType('range')
		component.update()
		expect(component.instance().state).toEqual({
			range: {
				min: '0',
				max: '100',
				isMinInclusive: true,
				isMaxInclusive: true
			},
			type: 'range',
			error: null
		})
	})

	test('onToggleNoScore updates state', () => {
		const spy = jest.spyOn(RangeModal.prototype, 'updateSingleScore').mockImplementation(jest.fn())

		RangeModal.prototype.onToggleNoScore({ target: { checked: true } })
		expect(spy).toHaveBeenLastCalledWith('no-score')

		RangeModal.prototype.onToggleNoScore({ target: { checked: false } })
		expect(spy).toHaveBeenLastCalledWith('')

		spy.mockRestore()
	})

	test('getError returns expected errors', () => {
		expect(
			RangeModal.prototype.getError({
				min: 'no-score',
				max: 'no-score'
			})
		).toBe(null)
		expect(RangeModal.prototype.getError({ min: 'no-score', max: 'no-score' })).toBe(null)
		expect(RangeModal.prototype.getError({ min: '-1', max: '-1' })).toBe(
			'Scores must be between 0 and 100'
		)
		expect(RangeModal.prototype.getError({ min: '101', max: '101' })).toBe(
			'Scores must be between 0 and 100'
		)
		expect(RangeModal.prototype.getError({ min: '0', max: '101' })).toBe(
			'Scores must be between 0 and 100'
		)
		expect(RangeModal.prototype.getError({ min: '-1', max: '100' })).toBe(
			'Scores must be between 0 and 100'
		)
		expect(RangeModal.prototype.getError({ min: '200', max: '-200' })).toBe(
			'Scores must be between 0 and 100'
		)
		expect(RangeModal.prototype.getError({ min: '0', max: 'ABC' })).toBe(
			'Scores must be between 0 and 100'
		)
		expect(RangeModal.prototype.getError({ min: 'false', max: '100' })).toBe(
			'Scores must be between 0 and 100'
		)
		expect(RangeModal.prototype.getError({ min: '50', max: '0' })).toBe(
			"Min can't be larger than max"
		)
		expect(RangeModal.prototype.getError({ min: '0', max: '100' })).toBe(null)
		expect(RangeModal.prototype.getError({ min: '100', max: '100' })).toBe(null)
		expect(RangeModal.prototype.getError({ min: '0', max: '100' })).toBe(null)
	})

	test('onConfirm sets error state and does not call props.onConfirm if there is an error', () => {
		const component = mount(<RangeModal for="[100,0]" onConfirm={onConfirm} />)
		component.instance().onConfirm()

		expect(component.instance().state.error).toBe("Min can't be larger than max")
		expect(onConfirm).not.toHaveBeenCalled()
	})

	test('onConfirm calls props.onConfirm if there is no error', () => {
		const component = mount(<RangeModal for="[0,100]" onConfirm={onConfirm} />)
		component.instance().onConfirm()

		expect(component.instance().state.error).toBe(null)
		expect(onConfirm).toHaveBeenCalled()
	})

	test('RangeModal component calls onConfirm from props', () => {
		const component = mount(<RangeModal for="[0,100]" onConfirm={onConfirm} />)

		component
			.find('button')
			.at(2)
			.simulate('click')

		expect(onConfirm).toHaveBeenCalled()
	})

	test('RangeModal component calls onConfirm from props with single value', () => {
		const component = mount(<RangeModal for="100" onConfirm={onConfirm} />)

		component
			.find('button')
			.at(2)
			.simulate('click')

		expect(onConfirm).toHaveBeenCalled()
	})

	test('RangeModal component does not call confirm when for is above 100', () => {
		const component = mount(<RangeModal for="10000" onConfirm={onConfirm} />)

		component
			.find('button')
			.at(2)
			.simulate('click')

		expect(onConfirm).not.toHaveBeenCalled()
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('RangeModal component does not call confirm when min or max are above 100', () => {
		const component = mount(<RangeModal for="[0,10000]" onConfirm={onConfirm} />)

		component
			.find('button')
			.at(2)
			.simulate('click')

		expect(onConfirm).not.toHaveBeenCalled()
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('RangeModal component does not call confirm when min is greater than max', () => {
		const component = mount(<RangeModal for="[80,30]" onConfirm={onConfirm} />)

		component
			.find('button')
			.at(2)
			.simulate('click')

		expect(onConfirm).not.toHaveBeenCalled()
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('RangeModal component focuses on first element', () => {
		const component = mount(<RangeModal for="[0,100]" />)
		component.instance().focusOnFirstElement()
		expect(component.html()).toMatchSnapshot()
	})

	test('RangeModal component changes range type', () => {
		const component = mount(<RangeModal for="[0,100]" onConfirm={onConfirm} />)

		const typeSingleRadio = component.find('input').at(1)
		const typeRangeRadio = component.find('input').at(2)

		// verify initial state
		expect(typeSingleRadio.props().id).toContain('range-modal--type-single')
		expect(typeRangeRadio.props().id).toContain('range-modal--type-range')
		expect(component.instance().state.type).toBe('range')

		// check visibility
		expect(
			component.find({
				id: 'editor--sections--assessment--post-assessment--range-modal--single-input'
			}).length
		).toBe(0)
		expect(
			component.find({ id: 'editor--sections--assessment--post-assessment--range-modal--min' })
				.length
		).toBe(1)

		// switch radio to single
		typeSingleRadio.simulate('change', { target: { value: 'single' } })
		expect(component.instance().state.type).toBe('single')

		// check visibility
		expect(
			component.find({
				id: 'editor--sections--assessment--post-assessment--range-modal--single-input'
			}).length
		).toBe(1)
		expect(
			component.find({ id: 'editor--sections--assessment--post-assessment--range-modal--min' })
				.length
		).toBe(0)
		expect(component.html()).toMatchSnapshot()

		// switch radio back to range
		typeRangeRadio.simulate('change', { target: { value: 'range' } })
		expect(component.instance().state.type).toBe('range')
		expect(component.html()).toMatchSnapshot()

		// check visibility
		expect(
			component.find({
				id: 'editor--sections--assessment--post-assessment--range-modal--single-input'
			}).length
		).toBe(0)
		expect(
			component.find({ id: 'editor--sections--assessment--post-assessment--range-modal--min' })
				.length
		).toBe(1)
	})

	test('RangeModal component changes single score', () => {
		const component = mount(<RangeModal for="100" onConfirm={onConfirm} />)

		const singleInput = component.find('input').at(2)

		// verify initial state
		expect(singleInput.props().id).toContain('range-modal--single-input')

		// update
		singleInput.simulate('change', { target: { value: '75', type: 'number' } })

		expect(component.html()).toMatchSnapshot()
	})

	test('RangeModal component sets single "no-score" score', () => {
		const component = mount(<RangeModal for="100" onConfirm={onConfirm} />)

		const singleScoreNoScoreCheckBox = component.find('input').at(3)

		// verify initial state
		expect(singleScoreNoScoreCheckBox.props().id).toContain('range-modal--no-score')
		expect(component.instance().state.range.min).toBe('100')

		// enable no-score checkbox
		singleScoreNoScoreCheckBox.simulate('change', { target: { checked: true } })
		expect(component.instance().state.range.min).toBe('no-score')
		expect(component.html()).toMatchSnapshot()

		// now disable no-score checkbox
		singleScoreNoScoreCheckBox.simulate('change', { target: { checked: false } })
		expect(component.instance().state.range.min).toBe('')
		expect(component.html()).toMatchSnapshot()
	})

	test('RangeModal component changes first item of range', () => {
		const component = mount(<RangeModal for="[0,100]" onConfirm={onConfirm} />)

		const minRangeInput = component.find('input').at(3)

		// verify initial state
		expect(minRangeInput.props().id).toContain('range-modal--min')

		// update
		minRangeInput.simulate('change', { target: { value: '100', type: 'number' } })

		expect(component.html()).toMatchSnapshot()
	})

	test('RangeModal component changes inclusivity of first part of range', () => {
		const component = mount(<RangeModal for="[0,100]" onConfirm={onConfirm} />)

		const minInclusiveCheckbox = component.find('input').at(4)

		// verify initial state
		expect(minInclusiveCheckbox.props().id).toContain('range-modal--min-inclusive')

		// update
		minInclusiveCheckbox.simulate('change', { target: { checked: false, type: 'checkbox' } })

		expect(component.html()).toMatchSnapshot()
	})

	test('RangeModal component changes second item of range', () => {
		const component = mount(<RangeModal for="[0,100]" onConfirm={onConfirm} />)

		const maxRangeInput = component.find('input').at(5)

		// verify initial state
		expect(maxRangeInput.props().id).toContain('range-modal--max')

		// update
		maxRangeInput.simulate('change', { target: { value: '1', type: 'number' } })

		expect(component.html()).toMatchSnapshot()
	})

	test('RangeModal component changes inclusivity of second part of range', () => {
		const component = mount(<RangeModal for="[0,100]" onConfirm={onConfirm} />)
		const maxInclusiveCheckbox = component.find('input').at(6)

		// verify initial state
		expect(maxInclusiveCheckbox.props().id).toContain('range-modal--max-inclusive')

		// update
		maxInclusiveCheckbox.simulate('change', { target: { checked: false, type: 'checkbox' } })

		expect(component.html()).toMatchSnapshot()
	})
})
