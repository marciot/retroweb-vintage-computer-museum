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

var navHistory;
var baseURL = "";
var currentURL;
var wikiTemplate;

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
		navFetchResource(url);
	}
}

function navGoHome() {
	if(navHistory.length > 0) {
		var first = navHistory[0];
		baseURL = first[0];
		url     = first[1];
		navHistory.length = 0;
		currentURL = null;
		navFetchResource(url);
	}
}

function navHistoryPush(url) {
	if (navHistory == null) {
		navHistory = new Array();
	}
	navHistory.push([baseURL, url]);
}

function navFetchResource(url) {
	url = rewriteRelativeUrl(url);
	
	// Push the current page into the history
	if(currentURL) {
		navHistoryPush(currentURL);
	}
	
	// Rewrite a relative URL with a base prefix, if needed.
	// But if we have an absolute URL for our index, that
	// becomes the new base prefix.
	
	baseURL    = baseUrl(url);
	currentURL = urlFile(url);
	
	console.log( "BaseURL: " + baseURL + "  url: " + url );
	
	var iframe = document.getElementById("html-iframe");
	if(url) {
		if(endsWith(url, '.wiki')) {
			panels.open("navigator-panel");
			injectWikiContent(iframe, url);
		} else {
			panels.open("navigator-panel");
			iframe.src = url;
		}
		$("html,body", iframe.contentWindow.document).scrollTop(0);
	} else {
		iframe.src = "about:blank";
	}
}

function injectWikiContent(element, url) {
	if(wikiTemplate == null) {
		$.ajax({
			url: "wiki-template.html",
			success: function (data) {
				wikiTemplate = data;
				injectWikiContent(element, url);
			},
			error: function(jqXHR,textStatus) {alert("Failed to load wiki template:" + textStatus)}
		});
	} else {
		$.ajax({
			url: url,
			success: function (data) {
				$(element.contentWindow.document).empty();
				var wikiSrc = wikify(data);
				html = wikiTemplate.replace(/\$WIKI_CONTENT/g, wikiSrc)
								   .replace(/\$WIKI_SOURCE/g,
										wikiSrc.replace(/</g,'&lt;')
											   .replace(/>/g,'&gt;'))
								   .replace(/\$PLATFORM/g, getPlatform())
								   .replace(/\$PARENT_BASE_URL/g, removeTrailingSlash(''+window.location.pathname))
					               .replace(/\$WIKI_BASE_URL/g, removeTrailingSlash(baseUrl(url)));
				element.contentWindow.document.open();
				element.contentWindow.document.write(html);
				element.contentWindow.document.close();
			},
			error: function(jqXHR,textStatus) {alert("Failed to load URL: " + textStatus)}
		});
	}
}

function parseQuery(url) {
	var vars = (url || window.location.search).substring(1).split("&");
	var query = {};
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		query[pair[0]] = pair[1];
	}
	return query;
}

function processIconClick(href,text) {
	console.log("Click: " + href);
	
	if(href.indexOf("http") == 0) {
		window.open(href);
	} else
	if(href.indexOf("?") == 0) {
		var q = parseQuery(href);
		if(q.hasOwnProperty("doc") || q.hasOwnProperty("folder") || q.hasOwnProperty("folder-dot")) {
			gaTrackEvent("document-read", text);
			navFetchResource(q.doc || q.folder || q["folder-dot"]); 
		}
		else if(q.hasOwnProperty("boot-hd")) {
			fetchDriveFromUrl(text, "hd1", q["boot-hd"], true);
		}
		else if(q.hasOwnProperty("boot-floppy")) {
			fetchDriveFromUrl(text, "fd1", q["boot-floppy"], true);
		}
		else if(q.hasOwnProperty("boot-rom")) {
			gaTrackEvent("disk-mounted", text);
			emulatorBootFromRom();
		}
		else if(q.hasOwnProperty("floppy")) {
			if(emuState.isRunning()) {
				fetchDriveFromUrl(text, "fd1", value, false);
			} else {
				alert("Please boot the computer using a boot disk first");
			}
		}
		else if(q.hasOwnProperty("local-floppy")) {
			gaTrackEvent("disk-mounted", "local-floppy");
			mountLocalFile("fd1", true);
		}
		else if(q.hasOwnProperty("enter-url")) {
			promptNavigatorUrl();
		}
	}
}

function fetchDriveFromUrl(title, drive, url, isBootable) {
	gaTrackEvent("disk-mounted", title);
	mountDriveFromUrl(drive, rewriteRelativeUrl(url), isBootable);
}

function promptNavigatorUrl () {
	var example = "http://example.com/index.wiki";
	var url = window.prompt("Please enter a URL to a RetroWeb file", example);
	if (url & url != example) {
		navFetchResource(url);
	}
}