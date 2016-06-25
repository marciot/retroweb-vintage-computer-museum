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

function navGoBack() {
	history.back();
}

function navGoHome() {
	navTo("/");
}

function navInitialDoc() {
	renderWikiContent();
}

/* This fetches a new page via XHR and substitutes the content of the #retroweb-markup
 * element with the #retroweb-markup element from the new page. This function does not
 * render the content.
 */
function fetchAndReplaceWikiContent(url, callback) {
	console.log("fetchAndReplaceWikiContent:" + url );
	$("#retroweb-markup").load( url + " #retroweb-markup", function(response, status, xhr) {
		if ( status == "error" ) {
			var msg = "Sorry but there was an error: ";
			$("#retroweb-markup").html(msg + xhr.status + " " + xhr.statusText);
		} else {
			$("#retroweb-markup").children().first().unwrap();
			callback();
		}
	});
}

/* The wiki content is optionally followed by one or more A HREF tags. These are back-substituted into the
   text whenever the [[text]] notation is encountered
 */
class TrailingLinks {
	/* At construction, we remove the A HREF tags from the specified element */
	
	constructor(el) {
		this.links = $(this.findTrailingAnchors(el));
		this.links.detach();
	}
	
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
	
	/* Looks up a HREF by content */
	lookup(content) {
		var found;
		this.links.each(function(i) {
			if(content == $( this ).html()) {
				found = $( this ).attr("href");;
			}
		});
		return found;
	}
	
	substitute(el) {
		var that = this;
		$("A:not([href])",el).each(function(i,e){
			var href = that.lookup(e.innerHTML);
			if(href) {
				e.setAttribute("href", href);
			}
		});
	}
}

var finishFormatting;
var trailingLinks;

function renderWikiContent() {
	var el = document.getElementById("retroweb-markup");
	trailingLinks = new TrailingLinks(el);
	el.innerHTML = wikify(el.innerHTML)
		.replace(/\$EMULATOR/g, emuState.getEmulator())
		.replace(/\$EMU_NAME/g, emuState.getConfig().name)
		.replace(/\$EMU_PAGE/g, implicitUrlFromName(emuState.getConfig().name));;
	trailingLinks.substitute(el);
	
	var wikiTemplate = navImportDoc.getElementById("wikiTemplate").innerHTML;
	var html = wikiTemplate.replace(/\$WIKI_CONTENT/g, el.innerHTML);
	
	if(RetroWeb.query.debug == "html") {
		// If ?debug=html is present in the query, then show the transformed wiki source
		html = '<pre>' + html.replace(/\</g, "&lt;").replace(/\>/g, "&gt;") + '</pre>';
	}
	
	var element = document.getElementById("html-iframe");
	/* A bit of kludge here to handle the fact that document.write() seems to execute asynchronously.
	 * Rather than calling finishFormatting directly, we set a global function that gets
	 * called by the wiki template when the browser is done rendering the wiki content.
	 */
	finishFormatting = function() {
		var doc = element.contentWindow.document;
		processJSONContent(doc, doc.body);
		expandRetrowebIcons(doc, doc);
		navAttachHandlersToAnchors(element.contentWindow.document);
		element.contentWindow.applyDynamicFormatting(emuState.getEmulator());
	}
	
	$(element.contentWindow.document).empty();
	element.contentWindow.document.open();
	element.contentWindow.document.write('<html><body>'+html+'</html></body>');
	element.contentWindow.document.close();
	$("html,body", element.contentWindow.document).scrollTop(0);
	RetroWeb.addIOSErrorHandler(element.contentWindow);
}

function parseQueryFromUrl(url) {
	var searchPos = url.indexOf('?');
	return (searchPos != -1) ? parseQuery(url.substr(searchPos)) : {};
}

function navTo(url, specialBehavior) {
	var params = parseQueryFromUrl(url);
	
	console.log( "New url: " + url );
	
	if(params.emulator && params.emulator != emuState.getEmulator()) {
		/* If an emulator is specified, and it does not match what we are currently running,
		   then we must do a full page reload (to reset the emulator) */
		if(emuState.isRunning() &&
			(!confirm("Following this link will shutdown the emulator and change the computer type."))) {
				return false;
		}
		specialBehavior = 'redirect';
	} else {
		/* Otherwise, simply update the content in place */
		panels.setVisibility("navigator-panel");
		fetchAndReplaceWikiContent(url, renderWikiContent);
		console.log("Updated content: " + url + ((specialBehavior) ? " (" + specialBehavior + ")" : ''));
	}

	/* Update the browser history accordingly */
	
	switch(specialBehavior) {
		case 'popState':
			/* No history manipulation */
			break;
		case 'redirect':
			window.location.replace(url);
			break;
		default:
			history.pushState(null, null, url);
	}
}

function navAddPopStateHandler() {
	window.addEventListener("popstate", function(e) {
		console.log("Pop state " + window.location.href );
		navTo(window.location.href, 'popState');
	});
}

function navAttachHandlersToAnchors(element) {
	
	function clickHandler(href) {
		return navProcessIconClick(
			this.innerHTML,
			this.getAttribute("data-type"),
			this.getAttribute("href"),
			this.getAttribute("data-cfg")
		);
	}
	
	// Attach handler to anything not having an HREF
	$('A:not([href])', element).click(clickHandler);
	// Attach handler to local HREFs
	$('A[href]:not([href^="http"])', element).click(clickHandler);
	// Set target for external links so a new page gets opened
	$('A[href^="http"]', element).attr("target", "_blank");
}

