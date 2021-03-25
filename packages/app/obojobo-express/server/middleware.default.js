const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const bodyParser = require('body-parser')
const session = require('express-session')
const pgSession = require('connect-pg-simple')
const config = require('./config')
const compression = require('compression')
const logger = require('./logger')
const ObojoboDocumentServer = require('./obo_express')
const db = require('./db')
const IS_WEBPACK = process.env.IS_WEBPACK === 'true'
const engines = require('consolidate')

module.exports = app => {
	// =========== STATIC ASSET PATHS ================
	app.use(express.static(path.join(__dirname, 'public'))) // serve the files from public as static files
	app.use(compression()) // enable gzip compression
	app.disable('x-powered-by')

	// =========== VIEW ENGINES ================
	// register express-react-views template engine if not already registered
	if (!app.engines['ejs']) app.engine('ejs', engines.ejs)
	app.set('view engine', 'ejs') // set the default extension to ejs
	app.set('views', path.join(__dirname, 'views'))

	// =========== SET UP MIDDLEWARE ================
	app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
	app.use(bodyParser.json(config.general.bodyParser.jsonOptions))
	app.use(bodyParser.urlencoded(config.general.bodyParser.urlencodedOptions))
	app.use(bodyParser.text(config.general.bodyParser.textOptions))

	app.use(
		session({
			store: new (pgSession(session))({
				pgPromise: db,
				tableName: 'sessions'
			}),
			secret: config.general.cookieSecret,
			resave: false,
			name: config.general.cookieName,
			saveUninitialized: false,
			rolling: true,
			cookie: {
				path: '/',
				maxAge: 10 * 24 * 60 * 60 * 1000, // 30 days
				// use config.general.secureCookie to determine the next settings
				// sameSite 'none' is needed to support LTI launches from different domains
				sameSite: config.general.secureCookie ? 'none' : false,
				httpOnly: !config.general.secureCookie,
				secure: !!config.general.secureCookie
			}
		})
	)
	app.use(ObojoboDocumentServer)

	// Custom Routes
	app.use('/profile', require('./routes/profile'))

	// 404 handler
	app.use((req, res, next) => {
		// lets requests for webpack stuff (in /static/) fall through
		// to webpack
		if (IS_WEBPACK && req.path.startsWith('/static')) {
			next()
			return
		}

		res.missing()
	})

	// set security headers
	app.use((req, res, next) => {
		// Disable referrers for browsers that don't support strict-origin-when-cross-origin
		// Otherwise Only send the shortened referrer to a foreign origin, full referrer to a local host
		res.setHeader('Referrer-Policy', 'no-referrer, strict-origin-when-cross-origin')

		// Only connect to this site and subdomains via HTTPS for the next two years and also include in the preload list
		res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

		// Disable unsafe inline/eval and plugins, only load scripts and stylesheets from same origin, fonts from google,
		// and images from same origin and imgur. Sites should aim for policies like this.
		res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com https://www.youtube.com; connect-src 'self'; style-src-elem 'self' https://unpkg.com https://fonts.googleapis.com; font-src https://fonts.gstatic.com https://unpkg.com; img-src 'self' data: https://secure.gravatar.com https://i.ytimg.com; object-src 'none'; style-src 'self' 'unsafe-inline'; frame-src 'self' https://www.youtube-nocookie.com; frame-ancestors 'self'; form-action 'self'")

		res.setHeader('Access-Control-Allow-Origin', '*')
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization')
		next()
	})

	// uncaught error handler
	// you'll want to keep an eye out for 'Query read timeout' in your logs, it may indicate the db has gone away
	app.use((err, req, res, next) => {
		const timecode = new Date().getTime()
		logger.error(`Uncaught error (timecode shown on user error page: ${timecode})`, err)
		// res.unexpected is not always available here
		if (res.unexpected) return res.unexpected(err)

		res.status(500)
		res.send(`500 - Internal Server Error: ${timecode}`)
	})
}
