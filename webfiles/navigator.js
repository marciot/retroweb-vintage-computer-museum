/*
RetroWeb Browser
Copyright (C) 2014 Marcio Teixeira

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

function getNavOptionsFunc(opts) {
	if(opts && opts.document) {
		var url = rewriteRelativeUrl(opts.document);
		return function() {gaTrackEvent("document-shown", opts.document); showHtmlViewer(url);}
	}
	return function() {};
}

/* Adds an icon to the icon navigator */
function addNavigatorIcon (type, title, value, opts) {
	console.log("Adding navigator icon: type = " + type + " title = " + title);
	
	var label = document.createTextNode(title);
	var icon = document.createElement("li");	
	
	var post = getNavOptionsFunc(opts);
	
	icon.className = type;
	switch(type) {
		case "floppy":
			var url = rewriteRelativeUrl(value);
			icon.ondblclick = function () {
				if(emuState.isRunning()) {
					gaTrackEvent("disk-mounted", title);
					mountDriveFromUrl("fd1", url, false);
					post();
				} else {
					alert("Please boot the computer using a boot disk first");
				}
			}
			break;
		case "boot-hd":
			var url = rewriteRelativeUrl(value);
			icon.ondblclick = function ()
				{gaTrackEvent("disk-mounted", title); mountDriveFromUrl("hd1", url, true); post();}
			break;
		case "boot-floppy":
			icon.className = "boot-fd";
			var url = rewriteRelativeUrl(value);
			icon.ondblclick = function ()
				{gaTrackEvent("disk-mounted", title); mountDriveFromUrl("fd1", url, true); post();}
			break;
		case "boot-rom":
			icon.ondblclick = function ()
				{gaTrackEvent("disk-mounted", title); emulatorBootFromRom(); post();}
			break;
		case "hyperlink":
			if (endsWith(value, ".json")) {
				if (value.indexOf("http://") === 0) {
					icon.className = "world";
				} else {
					icon.className = "folder";
				}
				icon.ondblclick = function () {fetchNavigatorUrl(value); post();}
			} else {
				icon.className = "html-doc";
				icon.ondblclick = function () {window.open(value);}
			}
			break;
		case "document":
			var url = rewriteRelativeUrl(value);
			icon.ondblclick = function ()
				{gaTrackEvent("document-read", title); showHtmlViewer(url);}
			break;
		case "action":
			icon.className = value;
			switch (value) {
				case "local-floppy":
					icon.className = "upload";
					icon.ondblclick = function () {
						gaTrackEvent("disk-mounted", "local-floppy");
						mountLocalFile("fd1", true);
					};
					break;
				case "enter-url":
					icon.className = "world";
					icon.ondblclick = promptNavigatorUrl;
					break;
				default:
					console.log("Undefined action: value = " + value);
					return;
			}
			break;
		default:
			console.log("Undefined icon type: type = " + type);
			return;
	}

	icon.appendChild(label);
		
	document.getElementById("navigator").appendChild(icon);
}

/* Navigator I/O functions */

function LoadException(message) {
   this.message = message;
   this.name = "LoadException";
}

function fetchDataFromUrl (url, callback) {
	$.ajax({
		url: url,
		success: function (data) {
			try {
				callback(data);
			} catch (e) {
				alert ("Error processing response from " + url + ": " + e.message );
				navGoBack();
			}
		},
		error: function(jqXHR,textStatus) {
			alert("Error fetching " + url + ":" + textStatus);
			navGoBack();
		}
	});
}

function loadJSONIndex(json, callback) {
	if (
		typeof json.retroweb == 'undefined' ||
		typeof json.retroweb.version == 'undefined' ||
		typeof json.retroweb.index == 'undefined'
	) {
		throw new LoadException ("Index fails RetroWeb JSON format validation");
	}
	
	try {
		// Load platform specific index
		var index = json.retroweb.index[getPlatform()];
		if( index != undefined ) {
			for (var i = 0; i < index.length; ++i) {
				callback (index[i]);
			}
		}
		// Load platform generic index
		var index = json.retroweb.index["*"];
		if( index != undefined ) {
			for (var i = 0; i < index.length; ++i) {
				callback (index[i]);
			}
		}
	} catch (err) {
		alert (err.message);
	}
}

// Navigator functionality

var navHistory;
var emptyNav;
var baseURL = "";
var currentURL;

function urlIsAbsolute(url) {
	return url.indexOf("://") != -1;
}

function baseUrl(url) {
	return url.replace(/\/[^/]+$/, "/");
}

function urlFile(url) {
	return url.substr(url.lastIndexOf("/")+1);
}

function rewriteRelativeUrl(url) {
	var rewritten = url;
	if (urlIsAbsolute(url)) {
		rewritten = url;
	} else if (baseURL != undefined) {
		rewritten = baseURL + url;
	}
	var dotdot = /[^/]+\/\.\.\//;
	while(rewritten.match(dotdot)) {
		rewritten = rewritten.replace(dotdot,'');
	}
	return rewritten;
}

function removeTrailingSlash(url) {
	return url.replace(/\/$/,'');
}

function navGetBaseUrl() {
	return baseURL;
}

function navGoBack() {
	var last = navHistory.pop();
	if (last) {
		baseURL = last[0];
		url     = last[1];
		currentURL = null;
		fetchNavigatorUrl(url);
	}
}

function navGoHome() {
	if(navHistory.length > 0) {
		var first = navHistory[0];
		baseURL = first[0];
		url     = first[1];
		navHistory.length = 0;
		currentURL = null;
		fetchNavigatorUrl(url);
	}
}

function navHistoryPush(url) {
	if (navHistory == null) {
		navHistory = new Array();
	}
	navHistory.push([baseURL, url]);
}

function fetchNavigatorUrl(url) {
	var homeUrl = "index.json";
	if (url == undefined) {
		url = homeUrl;
	}
	
	// If first time, store the DOM of an empty navigator so we can
	// clear it again later
	if (emptyNav == null) {
		emptyNav = new StateSnapshot("navigator").capture();
	}
	emptyNav.restore();
	
	// Push the current page into the history
	if(currentURL) {
		navHistoryPush(currentURL);
	}
	
	// Rewrite a relative URL with a base prefix, if needed.
	// But if we have an absolute URL for our index, that
	// becomes the new base prefix.
	
	url        = rewriteRelativeUrl(url);
	baseURL    = baseUrl(url);
	currentURL = urlFile(url);
	
	console.log( "BaseURL: " + baseURL + "  url: " + url );
	
	try {
		fetchDataFromUrl(url, function(content) {
				loadJSONIndex(content, function(record) {
					addNavigatorIcon (record[0], record[1], record[2],record[3]);
				} );
			}
		);
	} catch (err) {
		alert(err.message);
	}
}

function promptNavigatorUrl () {
	var url = window.prompt("Please enter a URL to a RetroWeb JSON library index file","http://marciot.freeshell.org/macplus/library/index.json");
	if (url) {
		fetchNavigatorUrl(url);
	}
}