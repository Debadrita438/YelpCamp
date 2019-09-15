const express      = require("express"),
      router       = express.Router(),
      passport     = require("passport"),
      User         = require("../models/user"),
      Campground   = require("../models/campground"),
	  middleware   = require("../middleware"),
      async        = require("async");
const nodemailer   = require("nodemailer"),
      crypto       = require("crypto"),
      xoauth2      = require("xoauth2");

//root route
router.get("/", (req, res) => {
    res.render("landing");
});

// show register form
router.get("/register", (req, res) => {
   res.render("register", {page: 'register'}); 
});

// handle sign up logic
router.post("/register", (req, res) => {
	const newUser = new User({
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
	});

    if(req.body.adminCode === 'secretcode123') {
		newUser.isAdmin = true;
    }

    User.register(newUser, req.body.password, (err, user) => {
		if(err){
			console.log(err);
			return res.render("register", {error: err.message});
		}
		passport.authenticate("local")(req, res, () => {
			req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
			res.redirect("/campgrounds"); 
		});
	});
});

//show login form
router.get("/login", (req, res) => {
   res.render("login", {page: 'login'}); 
});

// handling login logic
router.post("/login", passport.authenticate("local", {
	successRedirect: "/campgrounds",
	failureRedirect: "/login",
	failureFlash: true,
	successFlash: 'Welcome to YelpCamp!'
}), (req, res) => {
});

// logout route
router.get("/logout", (req, res) => {
	req.logout();
	req.flash("success", "See you later!");
	res.redirect("/campgrounds");
});

// forgot password
router.get('/forgot', (req, res) => {
	res.render('forgot');
});

// Updating the password
router.post('/forgot', (req, res, next) => {
	async.waterfall([
		(done) => {
			crypto.randomBytes(20, (err, buf) => {
				const token = buf.toString('hex');
				done(err, token);
			});
		},
		(token, done) => {
			User.findOne({ email: req.body.email }, (err, user) => {
				if (!user) {
					req.flash('error', 'No account with that email address exists.');
					return res.redirect('/forgot');
				}
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
				user.save((err) => {
					done(err, token, user);
				});
			});
		},
		(token, user, done) => {
			const smtpTransport = nodemailer.createTransport({
				host: "smtp.gmail.com",
				port: 465,
				secure: true,
				service: 'Gmail', 
				auth: {
					type: "OAuth2",
					user: 'princeofsharingan918@gmail.com',
					clientId: '585672135425-85s03fgh80ppu0hm75hisbgp63ojpsp9.apps.googleusercontent.com',
					clientSecret: 'BQyyZw9NNx5rcabukN8-IqIO',
					refreshToken: '1/NbS9ARfaC0bk8DYYMbANNvYRBRZHYaBbGuMIVkQ6l80',
					accessToken: 'ya29.Glt8B0fFWS8ygxx7vF6CH-SkXlIapa447MqmHmC1l985kNHj2DJZO1VpiPCLAKZOHtSrEw4CYjFwF7irMi3bffYe9r7ilhaV5MvOnusjZ3KJarv-qgCZ1NKov3oC',
					expires: 1484314697598
				}
			});
			const mailOptions = {
				to: user.email,
				from: 'princeofsharingan918@gmail.com',
				subject: 'Node.js Password Reset',
				text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};
			smtpTransport.sendMail(mailOptions, (err) => {
				console.log('mail sent');
				req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
				done(err, 'done');
			});
		}
	], (err) => {
		if (err) return next(err);
		res.redirect('/forgot');
	});
});

// RESET - reset password
router.get('/reset/:token', (req, res) => {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
		if (!user) {
			req.flash('error', 'Password reset token is invalid or has expired.');
			return res.redirect('/forgot');
		}
		res.render('reset', {token: req.params.token});
	});
});

// UPDATE - updating password
router.post('/reset/:token', (req, res) => {
	async.waterfall([
		(done) => {
			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
				if (!user) {
					req.flash('error', 'Password reset token is invalid or has expired.');
					return res.redirect('back');
				}
				if(req.body.password === req.body.confirm) {
					user.setPassword(req.body.password, (err) => {
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;
						user.save((err) => {
							req.logIn(user, (err) => {
								done(err, user);
							});
						});
					});
				} 
				else {
					req.flash("error", "Passwords do not match.");
					return res.redirect('back');
				}
			});
		},
		(user, done) => {
			const smtpTransport = nodemailer.createTransport({
				service: 'Gmail', 
				auth: {
					user: 'princeofsharingan918@gmail.com',
					pass: process.env.GMAILPW
				}
			});
			const mailOptions = {
				to: user.email,
				from: 'princeofsharingan918@gmail.com',
				subject: 'Your password has been changed',
				text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
			};
			smtpTransport.sendMail(mailOptions, (err) => {
				req.flash('success', 'Success! Your password has been changed.');
				done(err);
			});
		}
	], (err) => {
		res.redirect('/campgrounds');
	});
});

// USER PROFILE
router.get('/users/:id', async function(req, res) {
	try {
		let user = await User.findById(req.params.id).populate('followers').exec();
		res.render('profile', {user});
	}
	catch(err) {
		req.flash('error', err.message);
		return res.redirect('back');
	}
});

module.exports = router;