import { mount, shallow } from 'enzyme'

import AssessmentUtil from '../../../src/scripts/viewer/util/assessment-util'
import FocusUtil from '../../../src/scripts/viewer/util/focus-util'
import NavUtil from '../../../src/scripts/viewer/util/nav-util'
import React from 'react'
import renderer from 'react-test-renderer'

jest.mock('../../../src/scripts/viewer/util/focus-util')

class MockStylableText {
	constructor(text) {
		this.value = text
	}
}
const mockStylableComponent = props => <div {...props} className={'mockStylableText'} />
const mockDispatcherTrigger = jest.fn()
const mockFocus = jest.fn()

// Common
jest.mock('obojobo-document-engine/src/scripts/common', () => ({
	models: {
		OboModel: {
			models: {
				5: {}
			}
		}
	},
	util: {
		getBackgroundImage: jest.fn(),
		isOrNot: require('obojobo-document-engine/src/scripts/common/util/isornot').default
	},
	text: {
		StyleableText: MockStylableText,
		StyleableTextComponent: mockStylableComponent
	},
	components: {
		Button: require('../../../src/scripts/common/components/button').default
	},
	flux: {
		Dispatcher: {
			trigger: mockDispatcherTrigger
		}
	},
	page: {
		focus: mockFocus
	}
}))

// AssessmentUtil
jest.mock('../../../src/scripts/viewer/util/assessment-util', () => ({
	getAssessmentScoreForModel: jest.fn(),
	getAttemptsRemaining: jest.fn()
}))

// NavUtil
jest.mock('../../../src/scripts/viewer/util/nav-util', () => ({
	canNavigate: jest.fn(),
	goto: jest.fn(),
	toggle: jest.fn(),
	getOrderedList: jest.fn(),
	getNavTarget: jest.fn(),
	close: jest.fn(),
	open: jest.fn(),
	isRedAlertEnabled: jest.fn(),
	setRedAlert: jest.fn()
}))

// NavStore
jest.mock('../../../src/scripts/viewer/stores/nav-store', () => ({}))

const Nav = require('../../../src/scripts/viewer/components/nav').default

describe('Nav', () => {
	const navItems = [
		{ id: 4, type: 'heading', label: 'label4' },
		{
			id: 5,
			type: 'link',
			label: 'label5',
			flags: { visited: false, complete: false, correct: false }
		}, // content type
		{
			id: 300,
			type: 'link',
			label: 'label300',
			contentType: 'Mock Content Type',
			flags: { visited: false, complete: false, correct: false }
		},
		// subLink with parent
		{
			id: 301,
			type: 'sub-link',
			label: 'label301',
			parent: {
				type: 'link',
				label: 'Parent Label'
			},
			contentType: 'Mock Content Type',
			flags: { visited: false, complete: false, correct: false }
		},
		// test StyleableText
		{
			id: 5,
			type: 'link',
			label: new MockStylableText('mockMe'),
			flags: { visited: false, complete: false, correct: false }
		}, // no label
		{
			id: 6,
			type: 'link',
			flags: { visited: false, complete: false, correct: false }
		}, // flip the flags
		{
			id: 56,
			type: 'link',
			label: 'label56',
			flags: { visited: true, complete: true, correct: true }
		},
		{
			id: 678,
			type: 'non-existant-type',
			label: 'label678',
			flags: { correct: false }
		},
		{ id: 6, type: 'sub-link', label: 'label6', flags: { correct: false } }
	]

	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('renders opened', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = {
			navState: {
				open: false,
				locked: true
			}
		}
		const component = renderer.create(<Nav {...props} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('renders closed', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = {
			navState: {
				open: true,
				locked: true
			}
		}
		const component = renderer.create(<Nav {...props} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('renders unlocked', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = {
			navState: {
				open: false,
				locked: false
			}
		}
		const component = renderer.create(<Nav {...props} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('renders all list item types (locked=true)', () => {
		NavUtil.getOrderedList.mockReturnValueOnce(navItems)
		const props = {
			navState: {
				open: false,
				locked: true,
				navTargetId: 56 // select this item
			}
		}
		const component = renderer.create(<Nav {...props} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('renders all list item types (locked=false)', () => {
		NavUtil.getOrderedList.mockReturnValueOnce(navItems)
		const props = {
			navState: {
				open: false,
				locked: false,
				navTargetId: 56 // select this item
			}
		}
		const component = renderer.create(<Nav {...props} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('renders blank title', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([{ id: 4, type: 'heading', label: '' }])
		const props = {
			navState: {
				open: false,
				locked: false,
				navTargetId: 56 // select this item
			}
		}
		const component = renderer.create(<Nav {...props} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('renders assessment information with score', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([
			{
				id: 4,
				type: 'link',
				label: 'label',
				fullPath: 'mockFullPath',
				flags: {
					complete: false,
					correct: false,
					assessment: true
				}
			}
		])
		const props = {
			navState: {
				open: true,
				locked: false
			}
		}

		AssessmentUtil.getAssessmentScoreForModel.mockReturnValueOnce(60)
		AssessmentUtil.getAttemptsRemaining.mockReturnValueOnce(2)

		const component = renderer.create(<Nav {...props} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('renders assessment information without score', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([
			{
				id: 4,
				type: 'link',
				label: 'label',
				fullPath: 'mockFullPath',
				flags: {
					complete: false,
					correct: false,
					assessment: true
				}
			}
		])
		const props = {
			navState: {
				open: true,
				locked: false
			}
		}

		AssessmentUtil.getAssessmentScoreForModel.mockReturnValueOnce(null)
		AssessmentUtil.getAttemptsRemaining.mockReturnValueOnce(2)

		const component = renderer.create(<Nav {...props} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('renders assessment information with singular attempt', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([
			{
				id: 4,
				type: 'link',
				label: 'label',
				fullPath: 'mockFullPath',
				flags: {
					complete: false,
					correct: false,
					assessment: true
				}
			}
		])
		const props = {
			navState: {
				open: true,
				locked: false
			}
		}

		AssessmentUtil.getAssessmentScoreForModel.mockReturnValueOnce(null)
		AssessmentUtil.getAttemptsRemaining.mockReturnValueOnce(1)

		const component = renderer.create(<Nav {...props} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('renders assessment information with unlimited attempts', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([
			{
				id: 4,
				type: 'link',
				label: 'label',
				fullPath: 'mockFullPath',
				flags: {
					complete: false,
					correct: false,
					assessment: true
				}
			}
		])
		const props = {
			navState: {
				open: true,
				locked: false
			}
		}

		AssessmentUtil.getAssessmentScoreForModel.mockReturnValueOnce(null)
		AssessmentUtil.getAttemptsRemaining.mockReturnValueOnce(Infinity)

		const component = renderer.create(<Nav {...props} />)
		const tree = component.toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('onClick link checks NavUtil.canNavigate and changes the page', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([
			{
				id: 5,
				type: 'link',
				label: 'label',
				fullPath: 'mockFullPath',
				flags: {
					complete: false,
					correct: false
				}
			}
		])
		const props = {
			navState: {
				open: false,
				locked: true,
				navTargetId: 5 // select this item
			}
		}
		const el = shallow(<Nav {...props} />)

		NavUtil.canNavigate.mockReturnValueOnce(false)
		NavUtil.getNavTarget.mockReturnValue({ id: 4 })
		expect(NavUtil.canNavigate).not.toHaveBeenCalled()
		el.find('li').simulate('click')
		expect(NavUtil.canNavigate).toHaveBeenCalledWith(props.navState)
		expect(NavUtil.goto).not.toHaveBeenCalled()

		NavUtil.canNavigate.mockReset()
		expect(NavUtil.canNavigate).not.toHaveBeenCalled()
		NavUtil.canNavigate.mockReturnValueOnce(true)
		el.find('li').simulate('click')
		expect(NavUtil.canNavigate).toHaveBeenCalledWith(props.navState)
		expect(NavUtil.goto).toHaveBeenCalledWith(5)
	})

	test('onClick sub-link scrolls to the chunk', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([
			{
				id: 5,
				type: 'sub-link',
				label: 'label',
				flags: {
					correct: false
				}
			}
		])
		const props = {
			navState: {
				open: false,
				locked: true,
				navTargetId: 5 // select this item
			}
		}

		const el = shallow(<Nav {...props} />)

		expect(FocusUtil.focusComponent).not.toHaveBeenCalled()
		el.find('li').simulate('click')
		expect(FocusUtil.focusComponent).toHaveBeenCalledTimes(1)
		expect(FocusUtil.focusComponent).toHaveBeenCalledWith(5, { animateScroll: true })
	})

	test('onClickSkipNavigation calls FocusUtil.focusOnNavTarget', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([
			{
				id: 5,
				type: 'sub-link',
				label: 'label',
				flags: {
					correct: false
				}
			}
		])
		const props = {
			navState: {
				open: false,
				locked: true,
				navTargetId: 5 // select this item
			}
		}
		const el = shallow(<Nav {...props} />)

		expect(FocusUtil.focusOnNavTarget).not.toHaveBeenCalled()
		el.find('.skip-nav-button').simulate('click')
		expect(FocusUtil.focusOnNavTarget).toHaveBeenCalledTimes(1)
	})

	test('Clicking on a link calls NavUtil.goto and FocusUtil.focusOnNavigation', () => {
		NavUtil.getOrderedList.mockReturnValue([
			{
				id: 'mock-id',
				type: 'link',
				label: 'label',
				fullPath: 'mockFullPath',
				flags: {
					visited: false,
					complete: false,
					correct: false
				}
			}
		])
		NavUtil.getNavTarget.mockReturnValue({ id: 'mock-target-id' })
		const props = {
			navState: {
				open: false,
				locked: false,
				navTargetId: 'mock-target-id'
			}
		}
		const el = mount(<Nav {...props} />)

		NavUtil.canNavigate.mockReturnValueOnce(true)
		const li = el.find('li')

		expect(FocusUtil.focusOnNavigation).not.toHaveBeenCalled()
		expect(NavUtil.goto).not.toHaveBeenCalled()
		expect(mockDispatcherTrigger).not.toHaveBeenCalled()
		li.simulate('click')
		expect(FocusUtil.focusOnNavigation).toHaveBeenCalledTimes(1)
		expect(NavUtil.goto).toHaveBeenCalledTimes(1)
		expect(NavUtil.goto).toHaveBeenCalledWith('mock-id')
		expect(mockDispatcherTrigger).not.toHaveBeenCalled()
	})

	test('Clicking on a link for a page you are already on fires viewer:scrollToTop', () => {
		NavUtil.getOrderedList.mockReturnValue([
			{
				id: 'mock-id',
				type: 'link',
				label: 'label',
				fullPath: 'mockFullPath',
				flags: {
					visited: false,
					complete: false,
					correct: false
				}
			}
		])
		NavUtil.getNavTarget.mockReturnValue({ id: 'mock-id' })
		const props = {
			navState: {
				open: false,
				locked: false,
				navTargetId: 'mock-id' // select this item
			}
		}
		const el = mount(<Nav {...props} />)

		NavUtil.canNavigate.mockReturnValueOnce(true)
		const li = el.find('li')

		expect(FocusUtil.focusOnNavigation).not.toHaveBeenCalled()
		expect(NavUtil.goto).not.toHaveBeenCalled()
		expect(mockDispatcherTrigger).not.toHaveBeenCalled()
		li.simulate('click')
		expect(FocusUtil.focusOnNavigation).not.toHaveBeenCalled()
		expect(NavUtil.goto).not.toHaveBeenCalled()
		expect(mockDispatcherTrigger).toHaveBeenCalledTimes(1)
		expect(mockDispatcherTrigger).toHaveBeenCalledWith('viewer:scrollToTop', {
			value: { animateScroll: true }
		})
	})

	test('focus calls focus ', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = {
			navState: {
				open: false,
				locked: true
			}
		}
		const component = renderer.create(<Nav {...props} />)

		const mockSelfRef = jest.fn()
		component.getInstance().selfRef = mockSelfRef
		component.getInstance().focus()

		expect(mockFocus).toHaveBeenCalledWith(mockSelfRef)
	})

	test('closes nav on mount if mobile', () => {
		jest.useFakeTimers()
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = { navState: {} }
		window.matchMedia.mockReturnValueOnce({ matches: true })

		mount(<Nav {...props} />)
		expect(NavUtil.close).not.toHaveBeenCalled()
		jest.runAllTimers()

		expect(NavUtil.close).toHaveBeenCalled()
	})

	test('doesnt close nav on mount if not mobile', () => {
		jest.useFakeTimers()
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = { navState: {} }
		window.matchMedia.mockReturnValueOnce({ matches: false })

		mount(<Nav {...props} />)
		jest.runAllTimers()

		expect(NavUtil.close).not.toHaveBeenCalled()
	})

	test('registers resize listener on mount', () => {
		const spy = jest.spyOn(window, 'addEventListener')
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = { navState: {} }

		const component = mount(<Nav {...props} />)

		expect(spy).toHaveBeenCalledWith('resize', component.instance().hideOrShowOnResize)
	})

	test('hideOrShowOnResize calls open when increasing to non-mobile size', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = { navState: {} }
		window.matchMedia.mockReturnValueOnce({ matches: true })
		window.innerWidth = 10 // small size on mount

		// begin
		const component = mount(<Nav {...props} />)
		expect(NavUtil.open).not.toHaveBeenCalled()

		// increse width & no longer mobile
		window.innerWidth = 20
		window.matchMedia.mockReturnValueOnce({ matches: false })

		// execute resize listener
		component.instance().hideOrShowOnResize()

		expect(NavUtil.open).toHaveBeenCalled()
	})

	test('hideOrShowOnResize does nothing increasing in mobile size', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = { navState: {} }
		window.matchMedia.mockReturnValueOnce({ matches: true })
		window.innerWidth = 10 // small size on mount

		// begin
		const component = mount(<Nav {...props} />)
		expect(NavUtil.open).not.toHaveBeenCalled()

		// increse width & no longer mobile
		window.innerWidth = 20
		window.matchMedia.mockReturnValueOnce({ matches: true })

		// execute resize listener
		component.instance().hideOrShowOnResize()

		expect(NavUtil.open).not.toHaveBeenCalled()
	})

	test('hideOrShowOnResize calls close when decreasing to mobile size', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = { navState: {} }
		window.matchMedia.mockReturnValueOnce({ matches: false })
		window.innerWidth = 20 // larger size on mount

		// begin
		const component = mount(<Nav {...props} />)
		expect(NavUtil.close).not.toHaveBeenCalled()

		// decrease ans is mobile
		window.innerWidth = 10
		window.matchMedia.mockReturnValueOnce({ matches: true })

		// execute resize listener
		component.instance().hideOrShowOnResize()

		expect(NavUtil.close).toHaveBeenCalled()
	})

	test('hideOrShowOnResize does nothing when decreasing to desktop size', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = { navState: {} }
		window.matchMedia.mockReturnValueOnce({ matches: false })
		window.innerWidth = 20 // larger size on mount

		// begin
		const component = mount(<Nav {...props} />)
		expect(NavUtil.close).not.toHaveBeenCalled()

		// decrease ans is mobile
		window.innerWidth = 10
		window.matchMedia.mockReturnValueOnce({ matches: false })

		// execute resize listener
		component.instance().hideOrShowOnResize()

		expect(NavUtil.close).not.toHaveBeenCalled()
	})

	test('removes listeners on unmount', () => {
		const spy = jest.spyOn(window, 'removeEventListener')
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = { navState: {} }

		// begin
		const component = mount(<Nav {...props} />)

		// execute resize listener
		component.instance().componentWillUnmount()

		expect(spy).toHaveBeenCalledWith('resize', expect.any(Function))
		expect(spy).toHaveBeenCalledWith('mouseup', expect.any(Function))
		expect(spy).toHaveBeenCalledWith('pointerup', expect.any(Function))
	})

	test('registers window click listeners', () => {
		const spy = jest.spyOn(window, 'addEventListener')
		NavUtil.getOrderedList.mockReturnValueOnce([])
		const props = { navState: {} }

		// begin
		mount(<Nav {...props} />)
		expect(spy).toHaveBeenCalledWith('mouseup', expect.any(Function))
		expect(spy).toHaveBeenCalledWith('pointerup', expect.any(Function))
	})

	test('does nothing when clicked outside on desktop', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([])
		window.matchMedia.mockReturnValueOnce({ matches: false })
		window.matchMedia.mockReturnValueOnce({ matches: false })
		const props = { navState: {} }

		// begin
		const component = mount(<Nav {...props} />)
		component.instance().selfRef = {
			current: {
				contains: () => false
			}
		}
		component.instance().closeNavOnMobile({ target: true })
		expect(NavUtil.close).not.toHaveBeenCalled()
	})

	test('does nothing when clicked inside mobile', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([])
		window.matchMedia.mockReturnValueOnce({ matches: true })
		window.matchMedia.mockReturnValueOnce({ matches: true })
		const props = { navState: {} }

		// begin
		const component = mount(<Nav {...props} />)
		component.instance().selfRef = {
			current: {
				contains: () => true
			}
		}
		component.instance().closeNavOnMobile({ target: true })
		expect(NavUtil.close).not.toHaveBeenCalled()
	})

	test('closes when clicked outside on mobile', () => {
		NavUtil.getOrderedList.mockReturnValueOnce([])
		window.matchMedia.mockReturnValueOnce({ matches: true })
		window.matchMedia.mockReturnValueOnce({ matches: true })
		const props = { navState: {} }

		// begin
		const component = mount(<Nav {...props} />)
		component.instance().selfRef = {
			current: {
				contains: () => false
			}
		}
		component.instance().closeNavOnMobile({ target: true })
		expect(NavUtil.close).toHaveBeenCalled()
	})
})
