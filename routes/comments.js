const express = require("express");
const router  = express.Router({mergeParams: true});
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const middleware = require("../middleware");

//NEW - creating new comment
router.get("/new", middleware.isLoggedIn, (req, res) => {
	// find campground by id
	Campground.findById(req.params.id, (err, campground) => {
		if(err){
			console.log(err);
		}
		else {
			res.render("comments/new", {campground: campground});
		}
	});
});

//CRATE - create a new comment
router.post("/", middleware.isLoggedIn, (req, res) => {
	//Find the specific campground using ID
	Campground.findById(req.params.id, (err, campground) => { 
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		}
		else {
			Comment.create(req.body.comment, (err, comment) => {
				if(err){
					console.log(err);
				} 
				else {
					//add username and id to comment
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					//save comment
					comment.save();
					campground.comments.push(comment);
					campground.save();
					req.flash('success', 'Created a comment!');
					res.redirect('/campgrounds/' + campground._id);
				}
			});
		}
	});
});

// EDIT - edit a comment
router.get("/:commentId/edit", middleware.isLoggedIn, (req, res) => {
	// find campground by id
	Comment.findById(req.params.commentId, (err, comment) => {
		if(err){
			console.log(err);
		} 
		else {
			res.render("comments/edit", {campground_id: req.params.id, comment: comment});
		}
	});
});

// UPDATE - update the comment
router.put("/:commentId", (req, res) => {
	Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, comment){
		if(err){
			console.log(err);
			res.render("edit");
		} 
		else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	}); 
});

// DESTROY - delte a comment
router.delete("/:commentId", middleware.checkUserComment, (req, res) => {
	Comment.findByIdAndRemove(req.params.commentId, (err, comment) => {
		if(err){
			console.log(err);
		}
		else {
			Campground.findByIdAndUpdate(req.params.id, {
				$pull: {
					comments: comment.id
				}
			}, (err) => {
				if(err){ 
					console.log(err)
				}
				else {
					req.flash('success', 'Your comment has been deleted successfully!');
					res.redirect("/campgrounds/" + req.params.id);
				}
			});
		}
    });
});

module.exports = router;