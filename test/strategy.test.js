var chai = require('chai')
	, TwitterStrategy = require('../lib/strategy');


describe('Strategy', function () {

	describe('constructed', function () {
		var strategy = new TwitterStrategy({
			clientID: 'ABC123',
			clientSecret: 'secret',
		}, function () { });

		it('should be named twitter', function () {
			expect(strategy.name).to.equal('twitter');
		});
	})

	describe('constructed with undefined options', function () {
		it('should throw', function () {
			expect(function () {
				var strategy = new TwitterStrategy(undefined, function () { });
			}).to.throw(Error);
		});
	})

	describe('authorization request', function () {
		var strategy = new TwitterStrategy({
			clientID: 'ABC123',
			clientSecret: 'secret',
		}, function () { });

		strategy._oauth2.getOAuthAccessToken = function (token, verifier, callback) {
			callback(null, 'hh5s93j4hdidpola', 'hdhd0244k9j7ao03', {});
		}

		var url;

		before(function (done) {
			chai.passport.use(strategy)
				.redirect(function (u) {
					url = u;
					done();
				})
				.req(function (req) {
					req.session = {};
				})
				.authenticate();
		});

		it('should be redirected', function () {
			expect(url).to.equal('https://api.twitter.com/oauth/authenticate?response_type=code&client_id=ABC123');
		});
	});

	describe('authorization request with parameters', function () {
		var strategy = new TwitterStrategy({
			clientID: 'ABC123',
			clientSecret: 'secret',
		}, function () { });

		strategy._oauth2.getOAuthAccessToken = function (token, verifier, callback) {
			callback(null, 'hh5s93j4hdidpola', 'hdhd0244k9j7ao03', {});
		}

		var url;

		before(function (done) {
			chai.passport.use(strategy)
				.redirect(function (u) {
					url = u;
					done();
				})
				.req(function (req) {
					req.session = {};
				})
				.authenticate({ screenName: 'bob', forceLogin: true });
		});

		it('should be redirected', function () {
			expect(url).to.equal('https://api.twitter.com/oauth/authenticate?force_login=true&screen_name=bob&response_type=code&client_id=ABC123');
		});
	});

	describe('failure caused by user denying request', function () {
		var strategy = new TwitterStrategy({
			clientID: 'ABC123',
			clientSecret: 'secret',
		}, function () { });

		var info;

		before(function (done) {
			chai.passport.use(strategy)
				.fail(function (i) {
					info = i;
					done();
				})
				.req(function (req) {
					req.query = {};
					req.query.denied = '8L74Y149';
				})
				.authenticate();
		});

		it('should fail', function () {
			expect(info).to.be.undefined;
		});
	});

	describe('error caused by invalid client secret sent to request token URL', function () {
		var strategy = new TwitterStrategy({
			clientID: 'ABC123',
			clientSecret: 'secret',
			callbackURL: 'http://www.example.test/callback'
		}, function () { });

		strategy._oauth2.getOAuthAccessToken = function (token, verifier, callback) {
			callback({ statusCode: 401, data: '{"errors":[{"code":32,"message":"Could not authenticate you."}]}' });
		}

		var err;

		before(function (done) {
			chai.passport.use(strategy)
				.error(function (e) {
					err = e;
					done();
				})
				.req(function (req) {
					req.query = {};
					req.query.code = 'random_invalid_code';
				})
				.authenticate();
		});

		it('should error', function () {
			expect(err).to.be.an.instanceOf(Error);
			expect(err.message).to.equal("Could not authenticate you.");
		});
	});

	describe('error caused by invalid consumer secret sent to request token URL, formatted as unexpected JSON', function () {
		var strategy = new TwitterStrategy({
			clientID: 'ABC123',
			clientSecret: 'secret',
			callbackURL: 'http://www.example.test/callback'
		}, function () { });

		strategy._oauth2.getOAuthAccessToken = function (token, verifier, callback) {
			callback({ statusCode: 401, data: '{"foo":"bar"}' });
		}

		var err;

		before(function (done) {
			chai.passport.use(strategy)
				.error(function (e) {
					err = e;
					done();
				})
				.req(function (req) {
					req.query = {};
					req.query.code = 'banana';
				})
				.authenticate();
		});

		it('should error', function () {
			expect(err).to.be.an.instanceOf(Error);
			expect(err.constructor.name).to.equal('InternalOAuthError');
			expect(err.message).to.equal('Failed to obtain access token');
		});
	});

	describe('error caused by invalid callback sent to request token URL', function () {
		var strategy = new TwitterStrategy({
			clientID: 'ABC123',
			clientSecret: 'secret',
			callbackURL: 'http://www.example.test/invalid-callback'
		}, function () { });

		strategy._oauth2.getOAuthAccessToken = function (token, verifier, callback) {
			callback({ statusCode: 401, data: '<?xml version="1.0" encoding="UTF-8"?>\n<hash>\n  <error>This client application\'s callback url has been locked</error>\n  <request>/oauth/request_token</request>\n</hash>\n' });
		}

		var err;

		before(function (done) {
			chai.passport.use(strategy)
				.error(function (e) {
					err = e;
					done();
				})
				.req(function (req) {
					req.session = {};
					req.query = {};
					req.query.code = "banana";
				})
				.authenticate();
		});

		it('should error', function () {
			expect(err).to.be.an.instanceOf(Error);
			expect(err.message).to.equal("This client application's callback url has been locked");
		});
	});

	describe('error caused by invalid request token sent to access token URL', function () {
		var strategy = new TwitterStrategy({
			clientID: 'ABC123',
			clientSecret: 'secret',
			callbackURL: 'http://www.example.test/callback'
		}, function () { });

		strategy._oauth2.getOAuthAccessToken = function (token, verifier, callback) {
			callback({ statusCode: 401, data: 'Invalid request token.' });
		}

		var err;

		before(function (done) {
			chai.passport.use(strategy)
				.error(function (e) {
					err = e;
					done();
				})
				.req(function (req) {
					req.query = {};
					req.query.code = "banana";
					req.query['oauth_token'] = 'x-hh5s93j4hdidpola';
					req.query['oauth_verifier'] = 'hfdp7dh39dks9884';
					req.session = {};
					req.session['oauth:twitter'] = {};
					req.session['oauth:twitter']['oauth_token'] = 'x-hh5s93j4hdidpola';
					req.session['oauth:twitter']['oauth_token_secret'] = 'hdhd0244k9j7ao03';
				})
				.authenticate();
		});

		it('should error', function () {
			expect(err).to.be.an.instanceOf(Error);
			expect(err.message).to.equal("Invalid request token.");
		});
	});

	describe('error caused by invalid verifier sent to access token URL', function () {
		var strategy = new TwitterStrategy({
			clientID: 'ABC123',
			clientSecret: 'secret',
			callbackURL: 'http://www.example.test/callback'
		}, function () { });

		strategy._oauth2.getOAuthAccessToken = function (token, verifier, callback) {
			callback({ statusCode: 401, data: 'Error processing your OAuth request: Invalid oauth_verifier parameter' });
		}

		var err;

		before(function (done) {
			chai.passport.use(strategy)
				.error(function (e) {
					err = e;
					done();
				})
				.req(function (req) {
					req.query = {};
					req.query.code = "banana";
					req.query['oauth_token'] = 'hh5s93j4hdidpola';
					req.query['oauth_verifier'] = 'x-hfdp7dh39dks9884';
					req.session = {};
					req.session['oauth:twitter'] = {};
					req.session['oauth:twitter']['oauth_token'] = 'hh5s93j4hdidpola';
					req.session['oauth:twitter']['oauth_token_secret'] = 'hdhd0244k9j7ao03';
				})
				.authenticate();
		});

		it('should error', function () {
			expect(err).to.be.an.instanceOf(Error);
			expect(err.message).to.equal("Error processing your OAuth request: Invalid oauth_verifier parameter");
		});
	});
});