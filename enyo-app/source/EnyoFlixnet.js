enyo.kind({
	name: "EnyoFlixnet",
	kind: enyo.VFlexBox,
	movieHost: "http://archive.org/download/",
	downloadsPath: "file:///media/internal/downloads/",
	detailsOpen: false,
	downloadInProgress: false,
	downloadingMovie: null,
	downloadTicket: null,
	downloadPct: 0,
	pendingQueryQueue: [],
	pendingQueryIndex: 0,
	currentViewPendingFilenames: [],
	stillRunningEntries: [],
	moviesReady: false,
	searchActive: false,
	currentGenreId: null,
	allMovies: [],
	offlineFilteredMovies: [],
	currentSkip: 0,
	currentTake: 10,
	components: [
		{name: "localGenres", kind: "WebService", url: "data/genres.json", onSuccess: "gotGenres",      onFailure: "noLocalData"},
		{name: "localMovies", kind: "WebService", url: "data/movies.json", onSuccess: "gotLocalMovies", onFailure: "noLocalData"},
		{name: "downloadMgr", kind: "enyo.PalmService", service: "palm://com.palm.downloadmanager/", method: "download",
		                       subscribe: true, onSuccess: "downloadProgress", onFailure: "downloadFailed"},
		{name: "listPending", kind: "enyo.PalmService", service: "palm://com.palm.downloadmanager/", method: "listPending",
		                       onSuccess: "listPendingSuccess", onFailure: "listPendingFailed"},
		{name: "statusQuery", kind: "enyo.PalmService", service: "palm://com.palm.downloadmanager/", method: "downloadStatusQuery",
		                       onSuccess: "statusQuerySuccess", onFailure: "statusQueryFailed"},
		{name: "resumeQuery", kind: "enyo.PalmService", service: "palm://com.palm.downloadmanager/", method: "downloadStatusQuery",
		                       subscribe: true, onSuccess: "downloadProgress", onFailure: "downloadFailed"},
		{name: "cancelMgr",   kind: "enyo.PalmService", service: "palm://com.palm.downloadmanager/", method: "cancelDownload",
		                       onSuccess: "cancelSuccess", onFailure: "cancelFailed"},
		{name: "deleteMgr",   kind: "enyo.PalmService", service: "palm://com.palm.downloadmanager/", method: "deleteDownloadedFile",
		                       onSuccess: "deleteSuccess", onFailure: "deleteFailed"},
		{name: "appMgr",      kind: "enyo.PalmService", service: "palm://com.palm.applicationManager/", method: "open",
		                       onFailure: "appMgrFailed"},
		{name: "updater",     kind: "Helpers.Updater"},
		{kind: "Popup", name: "cancelConfirmPopup", lazy: false, layoutKind: "VFlexLayout", style: "width:80%", components: [
			{content: "<b>Cancel Download?</b>", allowHtml: true},
			{name: "cancelConfirmMsg", style: "padding:10px 0"},
			{layoutKind: "HFlexLayout", pack: "center", components: [
				{kind: "Button", caption: "Cancel Download", onclick: "cancelConfirmClick"},
				{kind: "Button", caption: "Keep Downloading", onclick: "cancelDenyClick"}
			]}
		]},
		{kind: "PageHeader", className: "enyo-toolbar", layoutKind: "HFlexLayout", align: "center", components: [
			{name: "appTitle", content: "FlixNet", className: "toolbar-title", flex: 1},
			{name: "searchInput", kind: "Input", hint: "Search movies...", flex: 1, showing: false,
			 className: "toolbar-search-input", onkeyup: "searchChanged"},
			{name: "btnSearch", allowHtml: true, content: "<img src='images/search.png' class='toolbar-search-btn'>",
			 style: "cursor:pointer;", onclick: "toggleSearch"}
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
				{name: "moviesLoading", className: "movies-loading", content: "Loading movies..."},
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
					{name: "btnPageDown", disabled:true, caption: "Prev", onclick: "prevPage"},
					{name: "btnPageUp", disabled:true, caption: "Next", onclick: "nextPage"}
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
		this.genres = [
			{id: 0,  genre: "random",     count: 0},
			{id: -1, genre: "downloads", count: 0}
		];
		this.movies = [];
		this.currentMovie = null;
		enyo.log("App started");
		this.$.appTitle.setContent("FlixNet: Random");
		this.$.localGenres.call();
		this.$.updater.CheckForUpdate("Flixnet");
		this.reconcilePendingDownloads();
	},
	slidingSelected: function(inSender, inIndex) {
		enyo.log("view: " + this.$.slidingPane.getViewName());
		if (this.$.slidingPane.getViewName() != "panelDetails") {
			this.detailsOpen = false;
			this.$.panelDetails.setShowing(false);
		}
	},
	selectNextView: function () {
		if (window.innerWidth <= 500) {
			var pane    = this.$.slidingPane;
			var viewIdx = pane.getViewIndex();
			if (viewIdx < pane.views.length - 1) {
				viewIdx = viewIdx + 1;
			} else {
				return;
			}
			pane.selectViewByIndex(viewIdx);
		}
	},
	gotGenres: function(inSender, inResponse) {
		this.genres = this.genres.concat(inResponse);
  		this.$.listGenres.render();
		this.$.localMovies.call();
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
		var genreId = thisGenre.id;
		this.currentGenreId = genreId;
		this.currentSkip = 0;
		if (this.searchActive) {
			this.searchActive = false;
			this.$.searchInput.hide();
			this.$.appTitle.show();
			this.$.btnSearch.applyStyle("opacity", "1");
		}
		this.$.appTitle.setContent("FlixNet: " + capitalizeFirstLetter(thisGenre.genre));
		if (genreId === 0) {
			this.currentViewPendingFilenames = [];
			this.offlineFilteredMovies = shuffleArray(this.allMovies);
		} else if (genreId === -1) {
			this.offlineFilteredMovies = this.buildDownloadsList();
		} else {
			this.currentViewPendingFilenames = [];
			var filtered = [];
			var i;
			for (i = 0; i < this.allMovies.length; i++) {
				var ids = this.allMovies[i].genre_ids;
				if (ids && ids.indexOf(genreId) !== -1) {
					filtered.push(this.allMovies[i]);
				}
			}
			this.offlineFilteredMovies = filtered.length > 0 ? filtered : this.allMovies;
		}
		this.movies = this.offlineFilteredMovies.slice(0, this.currentTake);
		this.$.listMovies.render();
		this.updatePageButtons();
		this.selectNextView();
	},
	gotLocalMovies: function(inSender, inResponse) {
		this.allMovies = inResponse;
		this.moviesReady = true;
		this.genres[0].count = inResponse.length;
		this.$.listGenres.render();
		this.offlineFilteredMovies = shuffleArray(inResponse);
		this.movies = this.offlineFilteredMovies.slice(0, this.currentTake);
		this.refreshDownloadedGenre();
		this.$.moviesLoading.hide();
  		this.$.listMovies.render();
  		this.updatePageButtons();
		this.resumeInProgressDownloads();
	},
	noLocalData: function() {
		enyo.log("No local data available");
		this.$.moviesLoading.setContent("Could not load movie data.");
	},
	prevPage: function() {
		this.currentSkip = Math.max(0, this.currentSkip - this.currentTake);
		this.movies = this.offlineFilteredMovies.slice(this.currentSkip, this.currentSkip + this.currentTake);
		this.$.listMovies.render();
		this.updatePageButtons();
	},
	nextPage: function() {
		this.currentSkip = this.currentSkip + this.currentTake;
		this.movies = this.offlineFilteredMovies.slice(this.currentSkip, this.currentSkip + this.currentTake);
		this.$.listMovies.render();
		this.updatePageButtons();
	},
	updatePageButtons: function() {
		this.$.btnPageDown.setDisabled(this.currentSkip <= 0);
		this.$.btnPageUp.setDisabled(this.currentSkip + this.currentTake >= this.offlineFilteredMovies.length);
	},
	renderMovieItem: function(inSender, inIndex) {
		var r = this.movies[inIndex];
		if (r) {
			var isPending = this.currentViewPendingFilenames.indexOf(this.getDownloadFilename(r)) !== -1;
			this.$.moviePoster.setSrc(r.poster.replace("https:", "http:"));
			this.$.moviePoster.applyStyle("opacity", isPending ? "0.4" : null);
			this.$.movieTitle.setContent(capitalizeFirstLetter(r.title) + (isPending ? " \u2193" : ""));
			return true;
		}
	},
	movieSelect: function(inSender, inEvent) {
		this.currentMovie = this.movies[inEvent.rowIndex];
		this.$.detailTitle.setContent(this.currentMovie.title);
		this.$.detailMeta.setContent("Rating: " + this.currentMovie.rating + "/10 | Runtime: " + this.currentMovie.runtime);
		this.$.detailDescription.setContent(this.currentMovie.description.replace("\n", "<br>"));
		this.$.movieBackdrop.setSrc(this.currentMovie.backdrop.replace("https:", "http:"));
		var filename = this.getDownloadFilename(this.currentMovie);
		var isThisMovieDownloading = this.downloadInProgress && this.downloadingMovie &&
			this.getDownloadFilename(this.downloadingMovie) === filename;
		if (isThisMovieDownloading) {
			var caption = this.downloadPct > 0 ? this.downloadPct + "%" : "Starting...";
			this.$.btnDownload.setCaption(caption);
			this.$.btnDownload.setDisabled(false);
			this.$.btnWatch.setDisabled(true);
		} else if (this.isPendingDownload(filename)) {
			this.$.btnDownload.setCaption("Downloading...");
			this.$.btnDownload.setDisabled(true);
			this.$.btnWatch.setDisabled(true);
		} else {
			this.setDownloadedState(this.isDownloaded(filename));
			this.$.btnWatch.setDisabled(this.downloadInProgress);
			this.$.btnDownload.setDisabled(this.downloadInProgress);
		}
		this.$.panelDetails.setShowing(true);
		this.$.slidingPane.selectViewByName("panelDetails");
		this.detailsOpen = true;
	},
	setDownloadedState: function(downloaded) {
		if (downloaded) {
			this.$.btnWatch.setCaption("Watch Download");
			this.$.btnDownload.setCaption("Delete Download");
		} else {
			this.$.btnWatch.setCaption("Watch");
			this.$.btnDownload.setCaption("Download");
		}
	},
	resetDownloadState: function() {
		this.downloadInProgress = false;
		this.downloadingMovie = null;
		this.downloadTicket = null;
		this.downloadPct = 0;
		this.$.btnWatch.setDisabled(false);
		this.$.btnDownload.setDisabled(false);
		var currentDownloaded = this.currentMovie && this.isDownloaded(this.getDownloadFilename(this.currentMovie));
		this.setDownloadedState(currentDownloaded);
	},
	toggleSearch: function() {
		this.searchActive = !this.searchActive;
		if (this.searchActive) {
			this.$.appTitle.hide();
			this.$.searchInput.show();
			this.$.searchInput.setValue("");
			this.$.btnSearch.applyStyle("opacity", "0.5");
			try { this.$.searchInput.forceFocus(); } catch(e) {}
		} else {
			this.$.searchInput.hide();
			this.$.appTitle.show();
			this.$.btnSearch.applyStyle("opacity", "1");
			this.currentSkip = 0;
			this.offlineFilteredMovies = shuffleArray(this.allMovies);
			this.movies = this.offlineFilteredMovies.slice(0, this.currentTake);
			this.$.listMovies.render();
			this.updatePageButtons();
			this.$.appTitle.setContent("FlixNet: Random");
		}
	},
	searchChanged: function(inSender, inEvent) {
		var term = inSender.getValue().toLowerCase();
		if (term.length === 0) {
			this.offlineFilteredMovies = this.allMovies;
		} else {
			var results = [];
			for (var i = 0; i < this.allMovies.length; i++) {
				if (this.allMovies[i].title.toLowerCase().indexOf(term) !== -1) {
					results.push(this.allMovies[i]);
				}
			}
			this.offlineFilteredMovies = results;
		}
		this.currentSkip = 0;
		this.movies = this.offlineFilteredMovies.slice(0, this.currentTake);
		this.$.listMovies.render();
		this.updatePageButtons();
	},
	posterError: function(inSender, inEvent) {
		inSender.setSrc("images/movieposter.png");
	},
	backdropError: function(inSender, inEvent) {
		inSender.setSrc("images/showtime.png");
	},
	// -- Downloaded genre --
	buildDownloadsList: function() {
		var downloads = this.getDownloads();
		var pendingDownloads = this.getPendingDownloads();
		var pendingFilenames = [];
		var p;
		for (p = 0; p < pendingDownloads.length; p++) {
			pendingFilenames.push(pendingDownloads[p].filename);
		}
		this.currentViewPendingFilenames = pendingFilenames;
		var result = [];
		var k;
		for (k = 0; k < this.allMovies.length; k++) {
			var fn = this.getDownloadFilename(this.allMovies[k]);
			var isConfirmed = false;
			var isPend = false;
			for (var j = 0; j < downloads.length; j++) {
				if (downloads[j].filename === fn) { isConfirmed = true; break; }
			}
			for (var p2 = 0; p2 < pendingFilenames.length; p2++) {
				if (pendingFilenames[p2] === fn) { isPend = true; break; }
			}
			if (isConfirmed || isPend) { result.push(this.allMovies[k]); }
		}
		return result;
	},
	refreshDownloadsIfActive: function() {
		if (this.currentGenreId !== -1) { return; }
		this.offlineFilteredMovies = this.buildDownloadsList();
		this.movies = this.offlineFilteredMovies.slice(this.currentSkip, this.currentSkip + this.currentTake);
		this.$.listMovies.render();
		this.updatePageButtons();
	},
	refreshDownloadedGenre: function() {
		var count = this.getDownloads().length + this.getPendingDownloads().length;
		for (var i = 0; i < this.genres.length; i++) {
			if (this.genres[i].id === -1) {
				this.genres[i].count = count;
				break;
			}
		}
		this.$.listGenres.render();
	},
	// -- Confirmed download storage --
	getDownloadFilename: function(movie) {
		var ext = movie.moviepath.split('.').pop();
		return toPascalCase(movie.title) + '.' + ext;
	},
	getDownloads: function() {
		try { return JSON.parse(localStorage.getItem("flixnet_downloads") || "[]"); } catch(e) { return []; }
	},
	isPendingDownload: function(filename) {
		var pending = this.getPendingDownloads();
		for (var i = 0; i < pending.length; i++) {
			if (pending[i].filename === filename) { return true; }
		}
		return false;
	},
	isDownloaded: function(filename) {
		var downloads = this.getDownloads();
		for (var i = 0; i < downloads.length; i++) {
			if (downloads[i].filename === filename) { return true; }
		}
		return false;
	},
	getDownloadTicket: function(filename) {
		var downloads = this.getDownloads();
		for (var i = 0; i < downloads.length; i++) {
			if (downloads[i].filename === filename) { return downloads[i].ticket; }
		}
		return null;
	},
	recordDownload: function(filename, ticket) {
		if (this.isDownloaded(filename)) { return; }
		var downloads = this.getDownloads();
		downloads.push({filename: filename, ticket: ticket});
		try { localStorage.setItem("flixnet_downloads", JSON.stringify(downloads)); } catch(e) {}
	},
	removeDownload: function(filename) {
		var downloads = this.getDownloads();
		var remaining = [];
		for (var i = 0; i < downloads.length; i++) {
			if (downloads[i].filename !== filename) { remaining.push(downloads[i]); }
		}
		try { localStorage.setItem("flixnet_downloads", JSON.stringify(remaining)); } catch(e) {}
	},
	// -- Pending download storage --
	getPendingDownloads: function() {
		try { return JSON.parse(localStorage.getItem("flixnet_pending") || "[]"); } catch(e) { return []; }
	},
	setPendingDownloads: function(arr) {
		try { localStorage.setItem("flixnet_pending", JSON.stringify(arr)); } catch(e) {}
	},
	recordPendingDownload: function(filename) {
		var pending = this.getPendingDownloads();
		pending.push({filename: filename, ticket: null});
		this.setPendingDownloads(pending);
	},
	updatePendingTicket: function(filename, ticket) {
		var pending = this.getPendingDownloads();
		for (var i = 0; i < pending.length; i++) {
			if (pending[i].filename === filename) {
				pending[i].ticket = ticket;
				this.setPendingDownloads(pending);
				return;
			}
		}
	},
	removePending: function(filename) {
		var pending = this.getPendingDownloads();
		var remaining = [];
		for (var i = 0; i < pending.length; i++) {
			if (pending[i].filename !== filename) { remaining.push(pending[i]); }
		}
		this.setPendingDownloads(remaining);
	},
	findMovieByFilename: function(filename) {
		for (var i = 0; i < this.allMovies.length; i++) {
			if (this.getDownloadFilename(this.allMovies[i]) === filename) {
				return this.allMovies[i];
			}
		}
		return null;
	},
	resumeInProgressDownloads: function() {
		if (this.downloadInProgress || this.stillRunningEntries.length === 0) { return; }
		var entry = this.stillRunningEntries[0];
		this.stillRunningEntries = [];
		var movie = this.findMovieByFilename(entry.filename);
		if (!movie) {
			enyo.log("Could not find movie for pending download: " + entry.filename);
			return;
		}
		enyo.log("Re-attaching to in-progress download: " + entry.filename + " ticket: " + entry.ticket);
		this.downloadInProgress = true;
		this.downloadingMovie = movie;
		this.downloadTicket = entry.ticket;
		this.downloadPct = 0;
		this.$.resumeQuery.call({ticket: entry.ticket, subscribe: true});
	},
	// -- Startup reconciliation --
	reconcilePendingDownloads: function() {
		if (!window.PalmServiceBridge) { return; }
		var pending = this.getPendingDownloads();
		var queryable = [];
		for (var i = 0; i < pending.length; i++) {
			if (pending[i].ticket !== null) { queryable.push(pending[i]); }
		}
		if (queryable.length !== pending.length) {
			this.setPendingDownloads(queryable); // drop entries that never got a ticket
		}
		if (queryable.length > 0) {
			enyo.log("Reconciling " + queryable.length + " pending download(s) via listPending");
			this.pendingQueryQueue = queryable;
			this.$.listPending.call({});
		}
	},
	listPendingSuccess: function(inSender, inResponse) {
		// Build a map of ticket → download info from the active list
		var active = inResponse.downloads || [];
		var activeMap = {};
		var i;
		for (i = 0; i < active.length; i++) {
			activeMap[active[i].ticket] = active[i];
		}
		// Sort our pending entries: still-running stay pending, absent ones need status queries
		var stillRunning = [];
		var toQuery = [];
		for (i = 0; i < this.pendingQueryQueue.length; i++) {
			var entry = this.pendingQueryQueue[i];
			if (activeMap[entry.ticket]) {
				if (activeMap[entry.ticket].completed) {
					enyo.log("Confirmed complete via listPending: " + entry.filename);
					this.recordDownload(entry.filename, entry.ticket);
					this.removePending(entry.filename);
					this.refreshDownloadedGenre();
				} else {
					enyo.log("Still downloading: " + entry.filename);
					stillRunning.push(entry);
				}
			} else {
				enyo.log("Not in listPending, will query status: " + entry.filename);
				toQuery.push(entry);
			}
		}
		this.stillRunningEntries = stillRunning;
		if (this.moviesReady && stillRunning.length > 0) {
			this.resumeInProgressDownloads();
		}
		if (toQuery.length > 0) {
			this.pendingQueryQueue = toQuery;
			this.pendingQueryIndex = 0;
			this.checkNextPending();
		}
	},
	listPendingFailed: function(inSender, inResponse) {
		enyo.log("listPending failed, falling back to individual status queries: " + JSON.stringify(inResponse));
		this.pendingQueryIndex = 0;
		this.checkNextPending();
	},
	checkNextPending: function() {
		if (this.pendingQueryIndex < this.pendingQueryQueue.length) {
			var entry = this.pendingQueryQueue[this.pendingQueryIndex];
			enyo.log("Querying status: " + entry.filename + " ticket: " + entry.ticket);
			this.$.statusQuery.call({ticket: entry.ticket});
		} else if (this.stillRunningEntries.length > 0 && this.moviesReady) {
			this.resumeInProgressDownloads();
		}
	},
	statusQuerySuccess: function(inSender, inResponse) {
		var entry = this.pendingQueryQueue[this.pendingQueryIndex];
		enyo.log("Status query for " + entry.filename + ": " + JSON.stringify(inResponse));
		if (inResponse.completed) {
			enyo.log("Confirmed complete via status query: " + entry.filename);
			this.recordDownload(entry.filename, entry.ticket);
			this.removePending(entry.filename);
			this.refreshDownloadedGenre();
		} else if (!inResponse.returnValue || inResponse.errorCode) {
			enyo.log("Not found in download manager, removing: " + entry.filename);
			this.removePending(entry.filename);
		} else {
			enyo.log("Still in progress via status query: " + entry.filename);
			this.stillRunningEntries.push(entry);
		}
		this.pendingQueryIndex++;
		this.checkNextPending();
	},
	statusQueryFailed: function(inSender, inResponse) {
		var entry = this.pendingQueryQueue[this.pendingQueryIndex];
		enyo.log("Status query failed for " + entry.filename + ", removing: " + JSON.stringify(inResponse));
		this.removePending(entry.filename);
		this.pendingQueryIndex++;
		this.checkNextPending();
	},
	// -- Watch / Download / Delete / Cancel --
	watchMovie: function(inSender, inEvent) {
		var movieURL;
		var filename = this.getDownloadFilename(this.currentMovie);
		if (this.isDownloaded(filename)) {
			movieURL = this.downloadsPath + filename;
			enyo.log("Playing local file: " + movieURL);
		} else {
			movieURL = this.movieHost + this.currentMovie.identifier + this.currentMovie.moviepath;
			enyo.log("Streaming: " + movieURL);
		}
		if (window.PalmServiceBridge) {
			this.$.appMgr.call({target: movieURL});
		} else {
			window.open(movieURL);
		}
	},
	appMgrFailed: function(inSender, inResponse) {
		enyo.log("appMgr failed: " + JSON.stringify(inResponse));
	},
	downloadMovie: function(inSender, inEvent) {
		var filename = this.getDownloadFilename(this.currentMovie);
		if (this.downloadInProgress && this.downloadingMovie &&
				this.getDownloadFilename(this.downloadingMovie) === filename) {
			this.showCancelConfirm();
		} else if (this.isDownloaded(filename)) {
			this.deleteDownload(filename);
		} else {
			var movieURL = this.movieHost + this.currentMovie.identifier + this.currentMovie.moviepath;
			if (window.PalmServiceBridge) {
				enyo.log("Download starting: " + movieURL + " -> " + filename);
				this.downloadInProgress = true;
				this.downloadingMovie = this.currentMovie;
				this.downloadPct = 0;
				this.recordPendingDownload(filename);
				this.refreshDownloadedGenre();
				this.$.btnDownload.setCaption("Starting...");
				this.$.btnDownload.setDisabled(false);
				this.$.btnWatch.setDisabled(true);
				this.$.downloadMgr.call({target: movieURL, targetFilename: filename, subscribe: true});
			} else {
				enyo.log("PalmServiceBridge unavailable, opening URL: " + movieURL);
				window.open(movieURL);
			}
		}
	},
	downloadProgress: function(inSender, inResponse) {
		enyo.log("Download progress: " + JSON.stringify(inResponse));
		if (inResponse.completed) {
			var filename = this.getDownloadFilename(this.downloadingMovie);
			enyo.log("Download complete: " + filename);
			this.recordDownload(filename, inResponse.ticket);
			this.removePending(filename);
			this.removePendingFromView(filename);
			this.refreshDownloadedGenre();
			this.$.listMovies.render();
			var completedTitle = this.downloadingMovie.title;
			this.resetDownloadState();
			this.showBanner("Download complete: " + completedTitle);
		} else if (inResponse.ticket && !inResponse.amountTotal) {
			enyo.log("Download queued, ticket: " + inResponse.ticket);
			this.downloadTicket = inResponse.ticket;
			this.updatePendingTicket(this.getDownloadFilename(this.downloadingMovie), inResponse.ticket);
			this.showBanner("Downloading: " + this.downloadingMovie.title);
		} else if (inResponse.amountTotal > 0) {
			var pct = Math.round((inResponse.amountReceived / inResponse.amountTotal) * 100);
			enyo.log("Download progress: " + inResponse.amountReceived + " / " + inResponse.amountTotal + " (" + pct + "%)");
			this.downloadPct = pct;
			if (this.currentMovie && this.getDownloadFilename(this.currentMovie) === this.getDownloadFilename(this.downloadingMovie)) {
				this.$.btnDownload.setCaption(pct + "%");
			}
		}
	},
	downloadFailed: function(inSender, inResponse) {
		enyo.log("Download failed: " + JSON.stringify(inResponse));
		this.removePending(this.getDownloadFilename(this.downloadingMovie));
		this.resetDownloadState();
		this.showBanner("Download failed");
	},
	showCancelConfirm: function() {
		this.$.cancelConfirmMsg.setContent("Stop downloading \"" + this.downloadingMovie.title + "\"?");
		this.$.cancelConfirmPopup.openAtCenter();
	},
	cancelConfirmClick: function() {
		this.$.cancelConfirmPopup.close();
		if (this.downloadTicket !== null && window.PalmServiceBridge) {
			enyo.log("Cancelling download ticket: " + this.downloadTicket);
			this.$.cancelMgr.call({ticket: this.downloadTicket});
		} else {
			this.removePending(this.getDownloadFilename(this.downloadingMovie));
			this.resetDownloadState();
		}
	},
	cancelDenyClick: function() {
		this.$.cancelConfirmPopup.close();
	},
	removePendingFromView: function(filename) {
		var updated = [];
		for (var i = 0; i < this.currentViewPendingFilenames.length; i++) {
			if (this.currentViewPendingFilenames[i] !== filename) { updated.push(this.currentViewPendingFilenames[i]); }
		}
		this.currentViewPendingFilenames = updated;
	},
	cancelSuccess: function(inSender, inResponse) {
		enyo.log("Cancel success: " + JSON.stringify(inResponse));
		var filename = this.getDownloadFilename(this.downloadingMovie);
		this.removePending(filename);
		this.removePendingFromView(filename);
		this.refreshDownloadedGenre();
		this.refreshDownloadsIfActive();
		this.resetDownloadState();
	},
	cancelFailed: function(inSender, inResponse) {
		enyo.log("Cancel failed (cleaning up anyway): " + JSON.stringify(inResponse));
		var filename = this.getDownloadFilename(this.downloadingMovie);
		this.removePending(filename);
		this.removePendingFromView(filename);
		this.refreshDownloadedGenre();
		this.refreshDownloadsIfActive();
		this.resetDownloadState();
	},
	deleteDownload: function(filename) {
		var ticket = this.getDownloadTicket(filename);
		enyo.log("Deleting download: " + filename + " (ticket: " + ticket + ")");
		this.$.btnDownload.setDisabled(true);
		if (ticket !== null && window.PalmServiceBridge) {
			this.$.deleteMgr.call({ticket: ticket});
		} else {
			enyo.log("No ticket available, removing record only");
			this.removeDownload(filename);
			this.$.btnDownload.setDisabled(false);
			this.setDownloadedState(false);
		}
	},
	deleteSuccess: function(inSender, inResponse) {
		var filename = this.getDownloadFilename(this.currentMovie);
		enyo.log("Delete success: " + filename);
		this.removeDownload(filename);
		this.refreshDownloadedGenre();
		this.refreshDownloadsIfActive();
		this.$.btnDownload.setDisabled(false);
		this.setDownloadedState(false);
	},
	deleteFailed: function(inSender, inResponse) {
		var filename = this.getDownloadFilename(this.currentMovie);
		enyo.log("Delete failed (removing record anyway): " + JSON.stringify(inResponse));
		this.removeDownload(filename);
		this.refreshDownloadedGenre();
		this.refreshDownloadsIfActive();
		this.$.btnDownload.setDisabled(false);
		this.setDownloadedState(false);
	},
	showBanner: function(message) {
		if (navigator.notification && navigator.notification.showBanner) {
			navigator.notification.showBanner(message);
		} else if (enyo.windows && enyo.windows.addBannerMessage) {
			enyo.windows.addBannerMessage(message, "{}");
		}
	}
});
