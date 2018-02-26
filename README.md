# passport-twitter-oauth2

[Passport](http://passportjs.org/) strategy for authenticating with [Twitter](http://www.twitter.com/)
using the OAuth 2.0 API.

This Strategy was modifed directly from Jared Hanson's [passport-facebook OAuth 2.0 Strategy](https://www.npmjs.com/package/passport-facebook) and [passport-twitter OAuth 1.0a Strategy](https://www.npmjs.com/package/passport-twitter) modules. This project was taken and modified and released to support Twitter OAuth 2.0 pipelines

This module lets you authenticate using Twitter in your Node.js applications.
By plugging into Passport, Twitter authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install passport-twitter-oauth2

## Usage

#### Create an Application

Before using `passport-twitter-oauth2`, you must register an application with
Twitter.  If you have not already done so, a new application can be created at
[Twitter Apps](https://apps.twitter.com/).  Your application will
be issued an app ID and app secret, which need to be provided to the strategy.
You will also need to configure a redirect URI which matches the route in your
application.

#### Configure Strategy

The Twitter authentication strategy authenticates users using a Twitter
account and OAuth 2.0 tokens.  The app ID and secret obtained when creating an
application are supplied as options when creating the strategy.  The strategy
also requires a `verify` callback, which receives the access token and optional
refresh token, as well as `profile` which contains the authenticated user's
Twitter profile.  The `verify` callback must call `cb` providing a user to
complete authentication.

```js
passport.use(new FacebookStrategy({
    clientID: TWITTER_APP_ID,
    clientSecret: TWITTER_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/twitter/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ twitterId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'twitter'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
app.get('/auth/twitter',
  passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
```

## Examples

Developers using the popular [Express](http://expressjs.com/) web framework can
refer to an [example](https://github.com/passport/express-4.x-twitter-example)
as a starting point for their own web applications.

## FAQ

##### How do I ask a user for additional permissions?

If you need additional permissions from the user, the permissions can be
requested via the `scope` option to `passport.authenticate()`.

```js
app.get('/auth/twitter',
  passport.authenticate('twitter', { scope: ['user_friends', 'manage_pages'] }));
```

Refer to [permissions with Twitter Login](https://developer.twitter.com/en/docs/basics/authentication/overview/application-permission-model)
for further details.

##### How do I re-ask for for declined permissions?

Set the `authType` option to `rerequest` when authenticating.

```js
app.get('/auth/twitter',
  passport.authenticate('twitter', { authType: 'rerequest', scope: ['user_friends', 'manage_pages'] }));
```

##### How do I obtain a user profile with specific fields?

The Twitter profile contains a lot of information about a user.  By default,
not all the fields in a profile are returned.  The fields needed by an application
can be indicated by setting the `profileFields` option.

```js
new TwitterStrategy({
  clientID: TWITTER_APP_ID,
  clientSecret: TWITTER_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/twitter/callback",
  profileFields: ['id', 'displayName', 'photos', 'email']
}), ...)
```

##### How do I obtain a user's email address?

Set the `includeEmail` option when creating the strategy.

```js
new TwitterStrategy({
  clientID: TWITTER_APP_ID,
  clientSecret: TWITTER_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/twitter/callback",
  includeEmail: true
}, ...)
```

## Contributing

#### Tests

The test suite is located in the `test/` directory.  All new features are
expected to have corresponding test cases.  Ensure that the complete test suite
passes by executing:

```bash
$ make test
```

#### Coverage

The test suite covers 100% of the code base.  All new feature development is
expected to maintain that level.  Coverage reports can be viewed by executing:

```bash
$ make test-cov
$ make view-cov
```

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2016-2018 Balanced Media Technlogy, LLC <[http://hewmen.io/](http://hewmen.io/)>
