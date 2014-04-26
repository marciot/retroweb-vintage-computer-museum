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

var baseURL = "/";
var wikiTemplate;

function parseUrl(url) {
	var address, path, search;
	
	/* Split the url into the pathname portion and the query */
	
	var searchPos = url.indexOf('?');
	if(searchPos != -1) {
		search  = url.substr(searchPos);
		path    = url.substr(0, searchPos);
	} else {
		path   = url;
		search = '';
	}
	var site = urlSite(url);
	if(site) {
		path = path.substr(site.length);
	}
	return {
		"site"   : site,
		"path"   : path,
		"search" : search
	}
}

function urlIsAbsolute(url) {
	return url.match(/^[a-z]+:\/\//);
}

function urlSite(url) {
	var match = url.match(/^[a-z]+:\/\/[^\/?#]+/) 
	return match ? match[0] : null;
}

function baseUrl(url) {
	if(url.indexOf("/") != -1) {
		return url.replace(/\/[^/]+$/, "/");
	} else {
		return '';
	}
}

function urlFile(url) {
	return url.substr(url.lastIndexOf("/")+1);
}

function rewriteRelativeUrl(url) {
	var rewritten = url;
	if (!urlIsAbsolute(url) && baseURL != "") {
		if(url.charAt(0) == '/') {
			rewritten = (urlSite(baseURL) || "") + url;
		} else {
			rewritten = baseURL + url;
		}
	}
	/* Handle ".." by stripping out all occurrences of "dirname/.." */
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
	history.back();
}

function navGoHome() {
	baseURL = '/';
	navTo(emuState.getInitialDoc());
}

function navInitialDoc() {
	navTo(query.doc || window.location.pathname + window.location.search, 'initialDoc');
}

function navJSONtoDOM( json ) {
	if(json.hasOwnProperty("icons")) {
		var typeToClassMap = {
			"floppy"          : "floppy",
			"boot-hd"         : "hd-dot",
			"boot-floppy"     : "floppy-dot",
			"boot-rom"        : "rom-dot",
			"folder"          : "folder",
			"folder-dot"      : "folder-dot",
			"doc"             : "document",
			"upload-floppy"   : "upload",
			"download-floppy" : "upload",
			"enter-url"       : "world",
			"hyperlink"       : "html-doc"
		}
	
		var div = document.createElement("div");
		div.className += "icons";
		if(json.hasOwnProperty("class")) {
			div.className += " " + json["class"];
		}
		var list = document.createElement("OL");
		div.appendChild(list);
		for (var i = 0; i < json.icons.length; ++i) {
			var name = json.icons[i][0];
			var type = json.icons[i][1];
			var arg  = json.icons[i][2];
			var opts = json.icons[i][3];
			
			var disk = document.createElement( "LI" );
			var icon = document.createElement( "A" );
			disk.appendChild(icon);
			icon.className += typeToClassMap[type];
			icon.appendChild(document.createTextNode(name));
			function getHandler(name, type, arg, opts) {
				return function() {
					navProcessIconClick(name, type, arg, opts);
				}
			}
			icon.onclick = getHandler(name, type, arg, opts);
			list.appendChild(disk);
		}
	}
	return div;
}

function navSetContent(url) {
	var iframe = document.getElementById("html-iframe");
	if(url) {
		if(endsWith(url, '.html') || endsWith(url, '.txt')) {
			panels.open("navigator-panel");
			iframe.src = url;
		} else {
			panels.open("navigator-panel");
			injectWikiContent(iframe, url + ".wiki");
		}
		$("html,body", iframe.contentWindow.document).scrollTop(0);
	} else {
		iframe.src = "about:blank";
	}
}

var finishFormatting;

function injectWikiContent(element, url) {
	if(wikiTemplate == null) {
		$.ajax({
			url: "/wiki-template.html",
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
				var jsonStorage = {};
				var data = data.replace(/\$EMULATOR/g, emuState.getEmulator())
				               .replace(/\$EMU_NAME/g, emuState.getConfig().name)
							   .replace(/\$EMU_PAGE/g, emuState.getConfig().name.replace(/ /g,'-'));
				var wikiSrc = wikify(data, jsonStorage);
				html = wikiTemplate.replace(/\$WIKI_CONTENT/g, wikiSrc)
								   .replace(/\$WIKI_SOURCE/g,
										wikiSrc.replace(/</g,'&lt;')
											   .replace(/>/g,'&gt;'))
					               .replace(/\$WIKI_BASE_URL/g, removeTrailingSlash(baseUrl(url)));
				/* A bit of kludge here to handle the fact that document.write() seems to execute asynchronously.
				 * Rather than calling finishFormatting directly, we set a global function that gets
				 * called by the wiki template when the browser is done rendering the wiki content.
				 */
				finishFormatting = function() {
					// Expand JSON elements embedded in the wiki text into DOM elements
					for(jsonId in jsonStorage) {
						$("#"+jsonId,element.contentWindow.document).replaceWith(navJSONtoDOM(jsonStorage[jsonId]));
					}
					// Attach handler to local HREFs
					$('A[href]:not([href^="http"])',element.contentWindow.document).click(navProcessAnchorClick);
					element.contentWindow.applyDynamicFormatting(emuState.getEmulator());
				}
				element.contentWindow.document.open();
				element.contentWindow.document.write(html);
				element.contentWindow.document.close();
			},
			error: function(jqXHR,textStatus) {alert("Failed to load URL: " + textStatus)}
		});
	}
}

function navTo(url, specialBehavior) {
	var u      = parseUrl(url);
	var params = u.search != '' ? parseQuery(u.search) : {};
	console.log( "Path: " + u.path + "  Search: " + u.search );
	
	/* Replace spaces in the path with dashes */
	
	u.path = u.path.replace(/ /g,'-');
	
	/* Figure out where we are going and adjust the baseURL */
	
	if(u.path == '/') {
		u.path = emuState.getInitialDoc();
	}
	
	if(u.path == '') {
		u.path = window.location.pathname;
	} else {
		u.path  = rewriteRelativeUrl(u.path);
		baseURL = baseUrl(u.path);
		console.log( "New baseURL: " + baseURL + "  New document: " + u.path );
	}
	url = u.path + u.search;
	
	if(params.emulator && params.emulator != emuState.getEmulator()) {
		/* If an emulator is specified, and it does not match what we are currently running,
		   then we must do a full page reload (to reset the emulator) */
		if(emuState.isRunning()) {
			if(!confirm("Following this link will shutdown the emulator and change the computer type.")) {
				return false;
			}
		}
		if(specialBehavior != 'popState') {
			window.location = url;
		}
	} else {
		/* Otherwise, simply update the content in place */
		navSetContent(u.path);
		console.log("Updated content: " + url + ((specialBehavior) ? " (" + specialBehavior + ")" : ''));
		switch(specialBehavior) {
			case 'popState':
				/* No history manipulation */
				break;
			case 'initialDoc':
				history.replaceState(null, null, url);
				break;
			default:
				history.pushState(null, null, url);
		}
	}
}

function navAddPopStateHandler() {
	window.addEventListener("popstate", function(e) {
		console.log("Pop state " + window.location.href );
		navTo(window.location.href, 'popState');
	});
}

function navProcessAnchorClick(href) {
	navTo($(this).attr('href'));
}

function processBootOptions(opts) {
	if(opts && "emulator-args" in opts) {
		var args = opts["emulator-args"];
		for(var arg in args) {
			emulatorSetArgument(arg, args[arg]);
		}
	}
}

function navProcessIconClick(name, type, param, opts) {
	switch(type) {
		case "doc":
		case "folder":
		case "folder-dot":
			gaTrackEvent("document-read", name);
			navTo(param || name);
			break;
		case "boot-hd":
			processBootOptions(opts);
			fetchDriveFromUrl(name, "hd1", param, true);
			break;
		case "boot-floppy":
			processBootOptions(opts);
			fetchDriveFromUrl(name, "fd1", param, true);
			break;
		case "boot-rom":
			gaTrackEvent("disk-mounted", name);
			emulatorBootFromRom();
		case "floppy":
			if(emuState.isRunning()) {
				fetchDriveFromUrl(name, "fd1", param, false);
			} else {
				alert("Please boot the computer using a boot disk first");
			}
			break;
		case "upload-floppy":
			gaTrackEvent("disk-mounted", "local-floppy");
			mountLocalFile("fd1", true);
			break;
		case "download-floppy":
			exportToLocal("fd1");
			break;
		case "enter-url":
			promptNavigatorUrl();
			break;
		case "hyperlink":
			window.open(param);
			break;
		default:
			alert("Action " + type + " is unknown");
			break;
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
		navTo(url);
	}
}