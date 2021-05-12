const getPresetProps = presetName => {
	switch (presetName) {
		case 'minimal': {
			return {
				bodyStyle: 'none',
				width: 'medium',
				font: 'serif',
				lineHeight: 'moderate',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: false
			}
		}

		case 'excerpt': {
			return {
				bodyStyle: 'none',
				width: 'medium',
				font: 'palatino',
				lineHeight: 'moderate',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: false
			}
		}

		case 'simple-filled': {
			return {
				bodyStyle: 'filled-box',
				width: 'medium',
				font: 'sans',
				lineHeight: 'moderate',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: false
			}
		}

		case 'simple-bordered': {
			return {
				bodyStyle: 'bordered-box',
				width: 'medium',
				font: 'sans',
				lineHeight: 'moderate',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: false
			}
		}

		case 'card': {
			return {
				bodyStyle: 'card',
				width: 'medium',
				font: 'sans',
				lineHeight: 'moderate',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: false
			}
		}

		case 'fiction': {
			return {
				bodyStyle: 'light-yellow-paper',
				width: 'medium',
				font: 'palatino',
				lineHeight: 'generous',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: true
			}
		}

		case 'non-fiction': {
			return {
				bodyStyle: 'modern-paper',
				width: 'medium',
				font: 'georgia',
				lineHeight: 'generous',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: true
			}
		}

		case 'historical': {
			return {
				bodyStyle: 'dark-yellow-paper',
				width: 'medium',
				font: 'palatino',
				lineHeight: 'generous',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: true
			}
		}

		case 'very-historical': {
			return {
				bodyStyle: 'aged-paper',
				width: 'medium',
				font: 'palatino',
				lineHeight: 'generous',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: true
			}
		}

		case 'white-paper': {
			return {
				bodyStyle: 'white-paper',
				width: 'medium',
				font: 'times-new-roman',
				lineHeight: 'moderate',
				fontSize: 'regular',
				topEdge: 'normal',
				bottomEdge: 'fade',
				effect: false
			}
		}

		case 'instruction-manual': {
			return {
				bodyStyle: 'modern-paper',
				width: 'medium',
				font: 'helvetica',
				lineHeight: 'moderate',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'fade',
				effect: false
			}
		}

		case 'typewritten': {
			return {
				bodyStyle: 'white-paper',
				width: 'medium',
				font: 'courier',
				lineHeight: 'moderate',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'jagged',
				effect: false
			}
		}

		case 'receipt': {
			return {
				bodyStyle: 'white-paper',
				width: 'tiny',
				font: 'monospace',
				lineHeight: 'moderate',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'jagged',
				effect: false
			}
		}

		case 'computer-modern': {
			return {
				bodyStyle: 'command-line',
				width: 'medium',
				font: 'monospace',
				lineHeight: 'moderate',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: false
			}
		}

		case 'computer-hacker-white': {
			return {
				bodyStyle: 'term-white',
				width: 'medium',
				font: 'monospace',
				lineHeight: 'moderate',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: true
			}
		}

		case 'computer-hacker-green': {
			return {
				bodyStyle: 'term-green',
				width: 'medium',
				font: 'monospace',
				lineHeight: 'moderate',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: true
			}
		}

		case 'computer-hacker-orange': {
			return {
				bodyStyle: 'term-orange',
				width: 'medium',
				font: 'monospace',
				lineHeight: 'moderate',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: true
			}
		}

		case 'modern-text-file': {
			return {
				bodyStyle: 'modern-text-file',
				width: 'medium',
				font: 'helvetica',
				lineHeight: 'generous',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: true
			}
		}

		case 'retro-text-file': {
			return {
				bodyStyle: 'retro-text-file',
				width: 'medium',
				font: 'monospace',
				lineHeight: 'generous',
				fontSize: 'smaller',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: true
			}
		}

		case 'computer-c64': {
			return {
				bodyStyle: 'term-c64',
				width: 'medium',
				font: 'monospace',
				lineHeight: 'moderate',
				fontSize: 'regular',
				topEdge: 'normal',
				bottomEdge: 'normal',
				effect: false
			}
		}
	}
}

export default getPresetProps
