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

/* At the bottom of the wiki content is one or more A HREF tags. These
   are back-substituted into the text whenever the [[text]] notation is
   encountered (these are anchors without hrefs).
 */
 
/* ************************** Content layout ***********************************/

class TrailingLinks {
	/* At construction, gather trailing anchors and remove them from DOM */
	constructor(el) {
		this.links = this.findTrailingAnchors(el);
		for(var i = 0; i < this.links.length; i++) {
			this.links[i].remove();
		}
	}

	/* Walk from the lastChild of el backwards skipping over whitespace nodes and
	 * and gathering up all anchors into a list. Stop at first non-whitespace or
	 * non-anchor element */
	findTrailingAnchors(el) {
		var anchors = [];
		var node = el.lastChild;
		while(node) {
			if(node.nodeType == 3 && !/^\s+$/.test(node.nodeValue)) {
				// Found text node that isn't whitespace
				break;
			}
			if(node.nodeType == 1) {
				if(node.tagName == "A") {
					anchors.push(node);
				} else  {
					// Found an element of another type
					break;
				}
			}
			node = node.previousSibling;
		}
		return anchors;
	}
	
	/* Looks up an anchor by content */
	lookup(content) {
		var found;
		for(var i = 0; i < this.links.length; i++) {
			if(content == this.links[i].innerHTML) {
				found = this.links[i].getAttribute("href");;
			}
		}
		return found;
	}
	
	/* For all anchors without an href, lookup a new value */
	substitute(el) {
		var that = this;
		var els = el.querySelectorAll('A:not([href])');
		for(var i = 0; i < els.length; i++) {
			var href = that.lookup(els[i].innerHTML);
			if(href) {
				els[i].setAttribute("href", href);
			}
		}
	}
}

function navAttachHandlersToAnchors(el) {
	function clickHandler(event) {
		navProcessIconClick(
			this.innerHTML,
			this.getAttribute("data-type"),
			this.getAttribute("href"),
			this.getAttribute("data-json")
		);
		event.stopPropagation();
		event.preventDefault();
	}

	function clickFootnote(event) {
		// Clicking on references to footnotes causes the container to scroll to the bottom
		var container = document.getElementById("html-content");
		container.scrollTop = container.scrollHeight;
		event.stopPropagation();
		event.preventDefault();
	}

	function attachAnchorHandler(el) {
		if(!el.hasAttribute('href')) {
			// Attach handler to anything not having an HREF
			el.addEventListener('click', clickHandler);
		} else {
			var href = el.getAttribute('href');
			if(href.indexOf('http') == 0) {
				// Set target for http or https links so a new page gets opened
				el.setAttribute("target", "_blank");
			} else if(href.indexOf('#') == 0) {
				el.addEventListener('click', clickFootnote);
			} else {
				el.addEventListener('click', clickHandler);
			}
		}
	}
	// Attach handlers to anchors
	var els = el.getElementsByTagName('a');
	for(var i = 0; i < els.length; i++) {
		attachAnchorHandler(els[i]);
	}
}

/* This is the rendering workhorse. It takes the wiki content from
 * retroweb-markup, pastes it into #html-content and applies successive
 * transformations to the text, ultimately resulting in the rendered page.
 */
function renderWikiContent() {
	var srcElement = document.getElementById("retroweb-markup");
	var dstElement = document.getElementById("html-content");

	/* Suppress initialization of custom elements until we are done rewriting the
	 * contents */
	dstElement.classList.remove("allowCustomElements");

	/* Check whether the new page requires a change of emulator */
	var altEmulator = needAlternativeEmulator(emulator.name);
	if(altEmulator) {
		navTo("?emulator=" + altEmulator);
		return;
	}

	dstElement.innerHTML = srcElement.innerHTML;

	/* Tell custom elements it is okay to initialize themselves */
	dstElement.classList.add("allowCustomElements");

	var trailingLinks = new TrailingLinks(dstElement);
	dstElement.innerHTML = wikify(dstElement.innerHTML);
	processJSONContent(document, dstElement);
	trailingLinks.substitute(dstElement);

	if(RetroWeb.query.debug == "html") {
		// If ?debug=html is present in the query, then show the transformed wiki source
		dstElement.innerHTML = '<pre>' + dstElement.innerHTML.replace(/\</g, "&lt;").replace(/\>/g, "&gt;") + '</pre>';
	}

	applyDynamicFormatting(dstElement, emulator.name);
	navAttachHandlersToAnchors(dstElement);

	document.querySelector("#html-content").scrollTop = 0;
}

/* This fetches a new page via XHR and substitutes the content of the #retroweb-markup
 * element with the #retroweb-markup element from the new page. This allows the user to
 * navigate to a new page without requiring a full page reload. */
function fetchAndReplaceWikiContent(url) {
		var target = document.querySelector("#retroweb-markup");

		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = 'document';
		request.onload = function() {
			if (request.status >= 200 && request.status < 400) {
				var srcElement = request.responseXML.querySelector('#retroweb-markup');
				/* Copy over attributes */
				var dataEmulator = srcElement.getAttribute('data-emulators');
				if(dataEmulator) {
					target.setAttribute('data-emulators', dataEmulator);
				}

				/* Copy the contents of #retroweb-markup over */
				target.innerHTML = srcElement.innerHTML;
				renderWikiContent();

				/* Copy the document title over */
				document.title = request.responseXML.querySelector('title').innerHTML;
			} else {
				target.innerHTML = "Sorry but there was an error: " + request.status + " " + request.statusText;
			}
		};
		request.onerror = function() {
			target.innerHTML = "Sorry but there was an error loading the page " + request.status + " " + request.statusText;
		};
		request.send();
}

/******************************* Event handlers (when icons are clicked) ********************************/

/* Converts a name into an URL by converting spaces to hyphens and appending .html */
function implicitUrlFromName(name) {
	return name.replace(/ /g,'-')+".html";
}

function navProcessIconClick(name, type, param, opts) {
	opts = opts ? JSON.parse(opts) : {};
	type = type ? type : "folder";

	function mountDriveFromUrl(name, drive, url, isBootable, bootOpts) {
		gaTrackEvent("disk-mounted", name);
		emulator.mountDriveFromUrl(drive, url, isBootable, bootOpts);
	}

	switch(type) {
		case "doc":
		case "folder":
		case "folder-dot":
			gaTrackEvent("document-read", name);
			navTo(param || implicitUrlFromName(name));
			break;
		case "hyperlink":
			window.open(param);
			break;
		case "boot-hd":
			mountDriveFromUrl(name, "hd1", param, true, opts);
			break;
		case "boot-floppy":
			mountDriveFromUrl(name, "fd1", param, true, opts);
			break;
		case "floppy":
			mountDriveFromUrl(name, "fd1", param, false, opts);
			break;
		case "boot-rom":
		case "power":
			gaTrackEvent("disk-mounted", name);
			emulator.bootFromRom();
			break;
		case "upload-floppy":
			gaTrackEvent("disk-mounted", "local-floppy");
			emulator.uploadFloppy("fd1", true);
			break;
		case "download-floppy":
			emulator.downloadFloppy("fd1");
			break;
		case "download-file":
			emulator.downloadFile(param);
			break;
		case "upload-file":
			emulator.uploadFile(param, "cassette file (.cas)");
			break;
		case "get-file":
			emulator.getFileFromUrl(param, opts.saveAs);
			break;
		case "cassette":
			emulator.cassetteAction(param);
			break;
		default:
			alert("Action " + type + " is unknown");
			break;
	}
	return false;
}

/*************************** Navigation functions *******************************/

function parseQueryFromUrl(url) {
	var searchPos = url.indexOf('?');
	return (searchPos != -1) ? parseQuery(url.substr(searchPos)) : {};
}

function navWithReload(url) {
	if(emulator.state.isRunning &&
		(!confirm("Following this link will shutdown the emulator and change the computer type."))) {
			return false;
	}
	window.location.replace(url);
}

function navAddPopStateHandler() {
	window.addEventListener("popstate", function(e) {
		fetchAndReplaceWikiContent(window.location.href);
	});
}

/* Public methods */

function navGoBack() {
	history.back();
}

function navInitialDoc() {
	renderWikiContent();
}

function navShow() {
	document.querySelector("#navigator-panel").style.display = 'block';
}

function navHide() {
	document.querySelector("#navigator-panel").style.display = 'none';
}

function navTo(url) {
	var params = parseQueryFromUrl(url);
	if(params.emulator && params.emulator != emulator.name) {
		/* If an emulator is specified, and it does not match what we are currently
		   running, then we must do a full page reload (to reset the emulator) */
		navWithReload(url);
	} else {
		/* Otherwise, simply update the content in place and update history */
		navShow();
		fetchAndReplaceWikiContent(url);
		history.pushState(null, null, url);
	}
}