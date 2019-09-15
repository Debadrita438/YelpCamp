const express    = require("express"),
      router     = express.Router(),
      Campground = require("../models/campground"),
      Comment    = require("../models/comment"),
      Review     = require("../models/review"),
      middleware = require("../middleware");


// Define escapeRegex function for search feature
function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX - show all campgrounds
router.get("/", (req, res) => {
	if(req.query.search && req.xhr) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		// Get all campgrounds from database
		Campground.find({name: regex}, (err, allCampgrounds) => {
			if(err){
				console.log(err);
			} else {
				res.status(200).json(allCampgrounds);
			}
		});
	} else {
		// Get all campgrounds from database
		Campground.find({}, (err, allCampgrounds) => {
			if(err){
				console.log(err);
			} else {
				if(req.xhr) {
					res.json(allCampgrounds);
				} else {
					res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds'});
				}
			}
		});
	}
});

//CREATE - create a new campground in the databse
router.post("/", middleware.isLoggedIn, (req, res) => {
	// get data from form and add to campgrounds array
	const name = req.body.name;
	const image = req.body.image;
	const desc = req.body.description;
	const author = {
		id: req.user._id,
		username: req.user.username
	}
	const cost = req.body.cost;
	const newCampground = {name: name, image: image, description: desc, cost: cost, author:author};
    // Create a new campground and save to database
    Campground.create(newCampground, (err, newlyCreated) => {
		if(err){
			req.flash("error", err.message)
		} else {
			//redirect back to campgrounds page
			res.redirect("/campgrounds");
		}
    });
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, (req, res) => {
	res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", (req, res) => {
	//find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
		path: "reviews",
		options: {sort: {createdAt: -1}}
	}).exec((err, foundCampground) => {
		if(err){
			req.flash("error", err.message);
		} else {
			//render show template with that campground
			res.render("campgrounds/show", {campground: foundCampground});
		}
    });
});

// EDIT - edit a specific campground
router.get("/:id/edit", middleware.checkUserCampground, (req, res) => {
	//find the campground with provided ID
	Campground.findById(req.params.id, (err, foundCampground) => {
		if(err){
			req.flash("error", err.message);
		} else {
			//render show template with that campground
			res.render("campgrounds/edit", {campground: foundCampground});
		}
	});
});

// UPDATE - update campground with the new data
router.put("/:id", (req, res) => {
	const newData = {name: req.body.name, image: req.body.image, description: req.body.description, cost: req.body.cost};
	Campground.findByIdAndUpdate(req.params.id, {$set: newData}, (err, campground) => {
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		} else {
			req.flash("success","Successfully Updated!");
			res.redirect("/campgrounds/" + campground._id);
		}
	});
});

// DESTROY - delete the specific campground
router.delete("/:id", (req, res) => {
	Campground.findByIdAndRemove(req.params.id, (err, campground) => {
		Comment.deleteMany({
			_id: {
				$in: campground.comments
			}
		}, (err, comments) => {
			req.flash('success', campground.name + ' deleted!');
			// deletes all reviews associated with the campground
			Review.deleteMany({"_id": {$in: campground.reviews}}, function (err) {
				if (err) {
					req.flash("error", err.message);
					res.redirect("/campgrounds");
				}
				res.redirect('/campgrounds');
			});
		});
	});
});

module.exports = router;