const mongoose   = require("mongoose"),
	  Campground = require("./models/campground"),
	  Comment    = require("./models/comment");

const data = [
	{
		name: "Sadelmalik",
		image: "https://images.unsplash.com/photo-1470246973918-29a93221c455?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=634&q=80",
		description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
	},
	
	{
		name: "Lake View",
		image: "https://images.unsplash.com/photo-1522893442332-0718950d64d3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=981&q=80",
		description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
	},
	
	{
		name: "Peace",
		image: "https://images.unsplash.com/photo-1505232070786-2f46d15f9f5e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1229&q=80",
		description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
	},
];

function seedDB() {
	// Remove all the campgrounds 	
	Campground.deleteMany({}, (err) => {
		if(err) {
			console.log(err);
		}
		console.log("Removed campgrounds!");
		// add in new campgrounds
		data.forEach((seed) => {
			Campground.create(seed, (err, campground) => {
				if(err) {
					console.log(err);
				}
				else {
					console.log("Added a campground!");
					// add few comments
					Comment.create({
							text: "This place is great! But I wish if there was internet.",
							author: "Homer"
					}, (err, comment) => {
						if(err) {
							console.log(err);
						}
						else {
							campground.comments.push(comment);
							campground.save();
							console.log("Created a new comment.");
						}
					});
				}
			});
		});
	});	
}

module.exports = seedDB;
