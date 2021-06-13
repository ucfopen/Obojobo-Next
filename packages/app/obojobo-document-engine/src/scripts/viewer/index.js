import ViewerAPI from './util/viewer-api'
import AssessmentStore from './stores/assessment-store'
import AssessmentMachineStates from './stores/assessment-store/assessment-machine-states'
import AssessmentUtil from './util/assessment-util'
import CurrentAssessmentStates from './util/current-assessment-states'
import FocusStore from './stores/focus-store'
import FocusUtil from './util/focus-util'
import Header from './components/header'
import Logo from './components/logo'
import MediaStore from './stores/media-store'
import MediaUtil from './util/media-util'
import NavStore from './stores/nav-store'
import NavUtil from './util/nav-util'
import OboComponent from './components/obo-component'
import OboQuestionAssessmentComponent from './components/obo-question-assessment-component'
import Flag from './components/flag'
import QuestionStore from './stores/question-store'
import QuestionResponseSendStates from './stores/question-store/question-response-send-states'
import QuestionUtil from './util/question-util'
import ViewerApp from './components/viewer-app'
import getLTIOutcomeServiceHostname from './util/get-lti-outcome-service-hostname'

export default {
	components: {
		ViewerApp,
		Logo,
		Header,
		OboComponent,
		OboQuestionAssessmentComponent,
		Flag
	},

	stores: {
		AssessmentStore,
		assessmentStore: {
			AssessmentMachineStates
		},
		NavStore,
		MediaStore,
		QuestionStore,
		questionStore: {
			QuestionResponseSendStates
		},
		FocusStore
	},

	util: {
		AssessmentUtil,
		CurrentAssessmentStates,
		NavUtil,
		ViewerAPI,
		MediaUtil,
		QuestionUtil,
		FocusUtil,
		getLTIOutcomeServiceHostname
	}
}
