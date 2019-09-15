const Comment    = require("../models/comment"),
      Campground = require("../models/campground"),
	  Review     = require("../models/review");

// All middleware goes here
const middlewareObj = {};

// Middleware to check whether the user is logged in or not
middlewareObj.isLoggedIn = (req, res, next) => {
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You must be signed in to do that!");
	res.redirect("/login");
}

// Middleware to check whether the user owns the campground or not
middlewareObj.checkUserCampground = (req, res, next) => {
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, function(err, campground){
			if(campground.author.id.equals(req.user._id) || req.user.isAdmin){
				next();
			} 
			else {
				req.flash("error", "You don't have permission to do that!");
				res.redirect("/campgrounds/" + req.params.id);
			}
		});
	}
	else {
		req.flash("error", "You need to be signed in to do that!");
		res.redirect("/login");
	}
}

// Middleware to check whether the user owns the comment or not
middlewareObj.checkUserComment = (req, res, next) => {
	if(req.isAuthenticated()){
		Comment.findById(req.params.commentId, function(err, comment){
			if(comment.author.id.equals(req.user._id) || req.user.isAdmin){
				next();
			} 
			else {
				req.flash("error", "You don't have permission to do that!");
				res.redirect("/campgrounds/" + req.params.id);
			}
		});
	}
	else {
		req.flash("error", "You need to be signed in to do that!");
		res.redirect("login");
	}
}

middlewareObj.checkReviewOwnership = (req, res, next) => {
    if(req.isAuthenticated()){
		Review.findById(req.params.review_id, (err, foundReview) => {
			if(err || !foundReview){
				res.redirect("back");
			}  else {
				// does user own the comment?
				if(foundReview.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
    }
	else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = (req, res, next) => {
    if (req.isAuthenticated()) {
		Campground.findById(req.params.id).populate("reviews").exec((err, foundCampground) => {
			if (err || !foundCampground) {
				req.flash("error", "Campground not found.");
				res.redirect("back");
			}
			else {
				// check if req.user._id exists in foundCampground.reviews
				const foundUserReview = foundCampground.reviews.some((review) => {
					return review.author.id.equals(req.user._id);
				});
				if (foundUserReview) {
					req.flash("error", "You already wrote a review.");
					return res.redirect("/campgrounds/" + foundCampground._id);
				}
				// if the review was not found, go to the next middleware
				next();
			}
		});
	}
	else {
		req.flash("error", "You need to login first.");
		res.redirect("back");
    }
};

module.exports = middlewareObj;
