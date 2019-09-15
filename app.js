const express        = require("express"),
      app            = express(),
      bodyParser     = require("body-parser"),
      mongoose       = require("mongoose"),
      passport       = require("passport"),
      cookieParser   = require("cookie-parser"),
      LocalStrategy  = require("passport-local"),
      flash          = require("connect-flash"),
      Campground     = require("./models/campground"),
      Comment        = require("./models/comment"),
      User           = require("./models/user"),
      session        = require("express-session"),
      seedDB         = require("./seeds"),
      methodOverride = require("method-override");
    
// configure dotenv
require('dotenv').config();

//requiring routes
const commentRoutes      = require("./routes/comments"),
	  reviewRoutes       = require("./routes/reviews"),
      campgroundRoutes   = require("./routes/campground"),
      indexRoutes        = require("./routes/index");
    
mongoose.connect("mongodb://localhost/yelp_camp_v13", { useNewUrlParser: true,  useCreateIndex: true, useFindAndModify: false, useUnifiedTopology: true });
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
app.use(cookieParser('secret'));
//require moment
app.locals.moment = require('moment');
// seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async function(req, res, next) {
	res.locals.currentUser = req.user;
	if(req.user) {
		 try {
			 let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
			 res.locals.notifications = user.notifications.reverse();
		 } catch(err) {
			 console.log(err.message);
		 }
	}
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

// For server listening 
app.listen(4000, () => {
	console.log("YelpCamp server listening on port 4000");
});