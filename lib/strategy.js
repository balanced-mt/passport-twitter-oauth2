// Load modules.
var OAuth2Strategy = require('passport-oauth2')
	, util = require('util')
	, uri = require('url')
	, XML = require('xtraverse')
	, Profile = require('./profile')
	, InternalOAuthError = require('passport-oauth2').InternalOAuthError
	, APIError = require('./errors/apierror');


/**
 * `Strategy` constructor.
 *
 * The Twitter authentication strategy authenticates requests by delegating to
 * Twitter using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Twitter application's App ID
 *   - `clientSecret`  your Twitter application's App Secret
 *   - `callbackURL`   URL to which Twitter will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new TwitterStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/twitter/callback'
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
	options = options || {};
	options.authorizationURL = options.authorizationURL || 'https://api.twitter.com/oauth/authenticate';
	options.sessionKey = options.sessionKey || 'oauth:twitter';
	options.tokenURL = options.tokenURL || 'https://api.twitter.com/oauth2/token';
	options.scopeSeparator = options.scopeSeparator || ',';

	OAuth2Strategy.call(this, options, verify);
	this.name = 'twitter';
	this._userProfileURL = options.userProfileURL || 'https://api.twitter.com/1.1/account/verify_credentials.json';
	this._skipExtendedUserProfile = (options.skipExtendedUserProfile !== undefined) ? options.skipExtendedUserProfile : false;
	this._includeEmail = (options.includeEmail !== undefined) ? options.includeEmail : false;
	this._includeStatus = (options.includeStatus !== undefined) ? options.includeStatus : true;
	this._includeEntities = (options.includeEntities !== undefined) ? options.includeEntities : true;;
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);


/**
 * Authenticate request by delegating to Twitter using OAuth 2.0.
 *
 * @param {http.IncomingMessage} req
 * @param {object} options
 * @access protected
 */
Strategy.prototype.authenticate = function (req, options) {
	// When a user denies authorization on Twitter, they are presented with a link
	// to return to the application in the following format (where xxx is the
	// value of the request token):
	//
	//     http://www.example.com/auth/twitter/callback?denied=xxx
	//
	// Following the link back to the application is interpreted as an
	// authentication failure.
	if (req.query && req.query.denied) {
		return this.fail();
	}

	OAuth2Strategy.prototype.authenticate.call(this, req, options);
};

/**
 * Return extra Twitter-specific parameters to be included in the user
 * authorization request.
 *
 * @param {object} options
 * @return {object}
 * @access protected
 */
Strategy.prototype.authorizationParams = function (options) {
	var params = {};
	if (options.forceLogin) {
		params.force_login = options.forceLogin;
	}
	if (options.screenName) {
		params.screen_name = options.screenName;
	}
	return params;
};

/**
 * Retrieve user profile from Twitter.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `id`        (equivalent to `user_id`)
 *   - `username`  (equivalent to `screen_name`)
 *
 * Note that because Twitter supplies basic profile information in query
 * parameters when redirecting back to the application, loading of Twitter
 * profiles *does not* result in an additional HTTP request, when the
 * `skipExtendedUserProfile` option is enabled.
 *
 * @param {string} token
 * @param {string} tokenSecret
 * @param {object} params
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function (accessToken, params, done) {
	if (!this._skipExtendedUserProfile) {
		var json;

		var url = uri.parse(this._userProfileURL);
		url.query = url.query || {};
		if (url.pathname.indexOf('/users/show.json') == (url.pathname.length - '/users/show.json'.length)) {
			url.query.user_id = params.user_id;
		}
		if (this._includeEmail == true) {
			url.query.include_email = true;
		}
		if (this._includeStatus == false) {
			url.query.skip_status = true;
		}
		if (this._includeEntities == false) {
			url.query.include_entities = false;
		}

		this._oauth2.get(uri.format(url), accessToken, function (err, body, res) {
			if (err) {
				if (err.data) {
					try {
						json = JSON.parse(err.data);
					} catch (_) { }
				}

				if (json && json.errors && json.errors.length) {
					var e = json.errors[0];
					return done(new APIError(e.message, e.code));
				}
				return done(new InternalOAuthError('Failed to fetch user profile', err));
			}

			try {
				json = JSON.parse(body);
			} catch (ex) {
				return done(new Error('Failed to parse user profile'));
			}

			var profile = Profile.parse(json);
			profile.provider = 'twitter';
			profile._raw = body;
			profile._json = json;
			// NOTE: The "X-Access-Level" header is described here:
			//       https://dev.twitter.com/oauth/overview/application-permission-model
			//       https://dev.twitter.com/oauth/overview/application-permission-model-faq
			profile._accessLevel = res.headers['x-access-level'];

			done(null, profile);
		});
	} else {
		var profile = { provider: 'twitter' };
		profile.id = params.user_id;
		profile.username = params.screen_name;

		done(null, profile);
	}
};

/**
 * Parse error response from Twitter OAuth endpoint.
 *
 * @param {string} body
 * @param {number} status
 * @return {Error}
 * @access protected
 */
Strategy.prototype.parseErrorResponse = function (body, status) {
	var json, xml;

	try {
		json = JSON.parse(body);
		if (Array.isArray(json.errors) && json.errors.length > 0) {
			return new Error(json.errors[0].message);
		}
	} catch (ex) {
		xml = XML(body)
		return new Error(xml.children('error').t() || body);
	}
};



// Expose constructor.
module.exports = Strategy;
