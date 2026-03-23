enyo.kind({
	name: "EnyoFlixnet",
	kind: enyo.VFlexBox,
	movieHost: "http://archive.org/download/",
	detailsOpen: false,
	offlineMode: false,
	allMovies: [],
	components: [
		{name: "flixnetGenres", kind: "WebService",  url: "http://flixnet.webosarchive.org/api/genres/",  onSuccess: "gotGenres",  onFailure: "failGenres"},
		{name: "flixnetMovies", kind: "WebService",  url: "http://flixnet.webosarchive.org/api/movies/",  onSuccess: "gotMovies",  onFailure: "failMovies"},
		{name: "localGenres",   kind: "WebService",  url: "data/genres.json",                             onSuccess: "gotGenres",  onFailure: "noLocalData"},
		{name: "localMovies",   kind: "WebService",  url: "data/movies.json",                             onSuccess: "gotLocalMovies", onFailure: "noLocalData"},
		{kind: "PageHeader", className: "enyo-toolbar", components: [
			{content: "FlixNet", className: "toolbar-title"}
		]},
		{name: "slidingPane", kind: "SlidingPane", multiViewMinWidth:"500", flex: 1, onSlideComplete: "slidingSelected", components: [
			{name: "panelGenres", width: "240px", components: [
				{kind: "Scroller", flex: 1, components: [
					{name: "listGenres", kind: "VirtualRepeater", onSetupRow: "renderGenreItem",
						components: [
							{kind: "Item", className: "enyo-toolbar", tapHighlight:true, layoutKind: "VFlexLayout", onclick: "genreSelect", components: [
								{name: "genreDescription", className: "toolbar-title"},
								{name: "genreTitle", kind: "Divider"}
							]}
						]
					}
				]}
			]},
			{name: "panelMovies", components: [
				{kind: "Scroller", flex:1, domStyles: {"margin-top": "0px", "min-width": "130px"}, components: [
					{name: "listMovies", kind: "VirtualRepeater", onSetupRow: "renderMovieItem",
						components: [
							{kind: "Item", className: "movie-item", layoutKind: "VFlexLayout", onclick: "movieSelect", components: [
								{name: "moviePoster", className: "movie-poster", kind: "Image", src: "images/movieposter.png", onerror:"posterError" },
								{name: "movieTitle", className: "movie-title" }
							]}
						]
					}
				]},
				{kind: "Toolbar", components: [
					{kind: "GrabButton"},
					{name: "btnPageDown", disabled:true, caption: "Prev", onclick: "setWallpaper"},
					{name: "btnPageUp", disabled:true, caption: "Next", onclick: "setWallpaper"}
				]}
			]},
			{name: "panelDetails", showing:false, dismissible: true, components: [
				{kind: "Scroller", flex:1, components: [
					{name: "movieFrame", className: "movie-backdrop-frame", components: [
						{name: "movieBackdrop", className: "movie-backdrop", kind: "Image", src: "images/showtime.png", onerror:"backdropError" },
					]},
					{name: "detailTitle", className: "movie-detail-title", content: "Movie Title"},	
					{name: "detailMeta", className: "movie-detail-meta", content: "Rating, Runtime"},
					{name: "detailDescription", content: "Movie Description", allowHtml: true}
				]},
				{kind: "Toolbar", components: [
					{kind: "GrabButton"},
					{name: "btnWatch", disabled:true, caption: "Watch", onclick: "watchMovie"},
					{name: "btnDownload", disabled:true, caption: "Download", onclick: "downloadMovie"}
				]}
			]},
		]},
	],
	create: function() {
		this.inherited(arguments);
		this.genres = [ {
			id: 0,
			genre: "random",
			count: 10
		}];
		this.movies = [];
		this.currentMovie = null;
		enyo.log("App started");
		if (window.location.href.indexOf("https") != -1) {
			enyo.log("Web server detected, switching to https");
			this.$.flixnetGenres.setUrl(this.$.flixnetGenres.url.replace("http://", "https://"));
			this.$.flixnetMovies.setUrl(this.$.flixnetMovies.url.replace("http://", "https://"));
		} 
		this.$.flixnetGenres.call();
		this.$.flixnetMovies.call();
	},
	slidingSelected: function(inSender, inIndex) {
		enyo.log("view: " + this.$.slidingPane.getViewName());
	
		if (this.$.slidingPane.getViewName() != "panelDetails") {
			enyo.log("I should hide the details pane");
			this.detailsOpen = false;
			this.$.panelDetails.setShowing(false);
		} else {
			enyo.log("I should leave the details pane alone");
		}
	
	},
	selectNextView: function () {
		if (window.innerWidth <= 500) {
			var pane    = this.$.slidingPane;
			var viewIdx = pane.getViewIndex();
			if (viewIdx < pane.views.length - 1) {
				viewIdx = viewIdx + 1;
			} else {
				return;	// we've selected the last available view.
			}
			pane.selectViewByIndex(viewIdx);
		}
	},
	gotGenres: function(inSender, inResponse) {
		//enyo.log("Genre response: " + JSON.stringify(inResponse));
		this.genres = this.genres.concat(inResponse);
		try { localStorage.setItem("flixnet_genres", JSON.stringify(inResponse)); } catch(e) {}
  		this.$.listGenres.render();
	},
	failGenres: function() {
		this.offlineMode = true;
		var cached;
		try { cached = localStorage.getItem("flixnet_genres"); } catch(e) {}
		if (cached) {
			this.gotGenres(null, JSON.parse(cached));
		} else {
			this.$.localGenres.call();
		}
	},
	renderGenreItem: function(inSender, inIndex) {
		var r = this.genres[inIndex];
		if (r) {
			this.$.genreTitle.setCaption(r.count + " movies");
			this.$.genreDescription.setContent(capitalizeFirstLetter(r.genre));
			return true;
		}
	},
	genreSelect: function(inSender, inEvent) {
		var thisGenre = this.genres[inEvent.rowIndex];
		if (this.offlineMode) {
			var genreId = thisGenre.id;
			var filtered = [];
			var i;
			for (i = 0; i < this.allMovies.length; i++) {
				if (this.allMovies[i].genre_id == genreId) {
					filtered.push(this.allMovies[i]);
				}
			}
			this.movies = filtered.length > 0 ? filtered : this.allMovies;
			this.$.listMovies.render();
		} else {
			var queryUrl = this.$.flixnetMovies.getUrl() + "?genre=" + thisGenre.id;
			this.$.flixnetMovies.setUrl(queryUrl);
			this.$.flixnetMovies.call();
		}
		this.selectNextView();
	},
	gotMovies: function(inSender, inResponse) {
		//enyo.log("Movies response: " + JSON.stringify(inResponse));
		this.movies = inResponse;
		if (this.allMovies.length === 0) {
			this.allMovies = inResponse;
			try { localStorage.setItem("flixnet_movies", JSON.stringify(inResponse)); } catch(e) {}
		}
  		this.$.listMovies.render();
	},
	failMovies: function() {
		this.offlineMode = true;
		if (this.allMovies.length > 0) {
			this.movies = this.allMovies;
			this.$.listMovies.render();
			return;
		}
		var cached;
		try { cached = localStorage.getItem("flixnet_movies"); } catch(e) {}
		if (cached) {
			this.allMovies = JSON.parse(cached);
			this.movies = this.allMovies;
			this.$.listMovies.render();
		} else {
			this.$.localMovies.call();
		}
	},
	gotLocalMovies: function(inSender, inResponse) {
		this.allMovies = inResponse;
		this.gotMovies(inSender, inResponse);
	},
	noLocalData: function() {
		enyo.log("No local fallback data available");
	},
	renderMovieItem: function(inSender, inIndex) {
		var r = this.movies[inIndex];
		if (r) {
			this.$.moviePoster.setSrc(r.poster.replace("https:", "http:"));
			this.$.movieTitle.setContent(capitalizeFirstLetter(r.title));
			return true;
		}
	},
	movieSelect: function(inSender, inEvent) {
		this.currentMovie = this.movies[inEvent.rowIndex];
		this.$.detailTitle.setContent(this.currentMovie.title);
		this.$.detailMeta.setContent("Rating: " + this.currentMovie.rating + "/10 | Runtime: " + this.currentMovie.runtime);
		this.$.detailDescription.setContent(this.currentMovie.description.replace("\n", "<br>"));
		this.$.movieBackdrop.setSrc(this.currentMovie.backdrop.replace("https:", "http:"));
		this.$.btnWatch.setDisabled(false);
		this.$.panelDetails.setShowing(true);
		this.$.slidingPane.selectViewByName("panelDetails");
		this.detailsOpen = true;
		//document.getElementById('enyoFlixnet_scroller3_innerClient').style.backgroundImage="url(images/showtime.png)"; // specify the image path here
	},
	posterError: function(inSender, inEvent) {
		inSender.setSrc("images/movieposter.png");
	},
	backdropError: function(inSender, inEvent) {
		inSender.setSrc("images/showtime.png");
	},
	watchMovie: function(inSender, inEvent) {
		var movieURL = this.movieHost + this.currentMovie.identifier + this.currentMovie.moviepath;
		window.open(movieURL);
	},
	downloadMovie: function(inSender, inEvent) {
		var movieURL = this.movieHost + this.currentMovie.identifier + this.currentMovie.moviepath;
		window.open(movieURL);
	}
});
