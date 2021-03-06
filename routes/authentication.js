var log = require('log4js').getLogger("authentication"),
	passport = require('passport'),
	User = require('../model/user'),
	CookieToken = require('../model/cookieToken'),
	config = require('../config/config.js');
	i18n = require("i18n");

// Get Login page
exports.index = function(req, res) {

	console.log(req.getLocale());
	//req.setLocale('zh_tw');
	//console.log(req.getLocale());
	
	res.render('login.html', {
		url : req.url.toString(), // use in layout for identify display info
		errorMsg : req.flash('msg') || "",
		activate : req.flash('activate') || ""
	});
};

/*
 * // Original interface for authenticate user by username and password (Web
 * Browser) exports.auth = passport.authenticate('local', { successRedirect :
 * '/user', failureRedirect : '/login', failureFlash: true });
 */

// POST Interface for authenticate user by username and password (Web Browser)
exports.auth = function(req, res, next) {

	passport.authenticate( 'local', { badRequestMessage: i18n.__("error.loginMissingFieldMsg") },  function(err, user, info) {

		if (err)
			return next(err);
		
		if (!user) {

			req.flash('msg', info.message);
			return res.redirect("/");

		} else {
			
			// Create cookie token if remember me is 'on'
			if (req.body.rememberMe) {

				new CookieToken({

					token : User.genToken(),
					userId : user.id,
					createdAt : new Date()

				}).save(function(err, cookieToken) {

					if (err)
						log.error(err);

					if (cookieToken) {

						req.logIn(user, function(err) {

							if (err) {
								return next(err);
							} else {
								res.cookie('cookieToken', cookieToken.token, {
									maxAge : config.defaultCookieDuration * 1000,
									httpOnly : true
								});
								return res.redirect("/user");
							}

						});

					}

				});

			} else {

				req.logIn(user, function(err) {
					if (err)
						return next(err);

					return res.redirect("/user");
				});

			}

		}

	})(req, res, next);

};


// POST Interface for authenticate user by username and password (Mobile)
exports.authMobile = function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {

		if (err)
			return next(err);

		if (!user) {

			return res.json(401, info);

		} else {

			req.logIn(user, function(err) {
				if (err)
					return next(err);

				return res.json(200, user);
			});

		}

	})(req, res, next);
};

// GET Interface for logout
exports.logout = function(req, res) {

	// Request logout
	req.logout();

	// Remove cookie and cookie token
	if (req.cookies.cookieToken) {

		CookieToken.findOneAndRemove({
			token : req.cookies.cookieToken
		}, function(err) {
			if (err)
				log.error(err);
		});
		res.clearCookie('cookieToken');
	}

	// Redirect index page
	res.redirect('/');

};
