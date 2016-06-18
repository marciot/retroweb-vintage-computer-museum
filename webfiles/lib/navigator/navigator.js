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

var navigatorPage = new NavigatorURL();

function navGoBack() {
	history.back();
}

function navGoHome() {
	navTo("/");
}

function navInitialDoc() {
	navTo(query.doc || window.location.pathname + window.location.search, 'initialDoc');
}

function navJSONtoDOM( doc, json ) {
	if(json.hasOwnProperty("emulators")) {
		if(json.emulators.indexOf(emuState.getEmulator()) == -1 && !query.emulator) {
			navTo("?emulator=" + json.emulators[0], 'redirect');
		}
	}
	
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
			"download-file"   : "upload",
			"upload-file"     : "upload",
			"enter-url"       : "world",
			"hyperlink"       : "html-doc",
			"cassette"        : "cassette"
		}
	
		var div = doc.createElement("div");
		div.className += "icons";
		if(json.hasOwnProperty("class")) {
			div.className += " " + json["class"];
		}
		var list = doc.createElement("OL");
		div.appendChild(list);
		for (var i = 0; i < json.icons.length; ++i) {
			var name = json.icons[i][0];
			var type = json.icons[i][1];
			var arg  = json.icons[i][2];
			var opts = json.icons[i][3];
			
			var disk = doc.createElement( "LI" );
			var icon = doc.createElement( "A" );
			disk.appendChild(icon);
			if( opts && opts.hasOwnProperty("className") ) {
				icon.className = opts.className;
			} else {
				icon.className += typeToClassMap[type];
			}
			icon.appendChild(doc.createTextNode(name));
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
	var wikiTemplate = navImportDoc.getElementById("wikiTemplate").innerHTML;
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
				               .replace(/\$WIKI_BASE_URL/g, url.replace(/.wiki$/,''));
			/* A bit of kludge here to handle the fact that document.write() seems to execute asynchronously.
			 * Rather than calling finishFormatting directly, we set a global function that gets
			 * called by the wiki template when the browser is done rendering the wiki content.
			 */
			finishFormatting = function() {
				// Expand JSON elements embedded in the wiki text into DOM elements
				for(jsonId in jsonStorage) {
					var dom = navJSONtoDOM(element.contentWindow.document, jsonStorage[jsonId]);
					$("#"+jsonId,element.contentWindow.document).replaceWith(dom);
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

function navTo(url, specialBehavior) {
		
	navigatorPage.apply(url);
	
	params = navigatorPage.params;
	
	if(navigatorPage.path == '/') {
		if(params.emulator) {
			navigatorPage.apply(emuState.getConfig(params.emulator)["emulator-doc"] + navigatorPage.search);
		} else {
			navigatorPage.apply(emuState.getInitialDoc() + navigatorPage.search);
		}
	}
	url = navigatorPage.href;
	
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
		navSetContent(navigatorPage.path);
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
		case 'initialDoc':
			history.replaceState(null, null, url);
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

function navProcessAnchorClick(href) {
	navTo($(this).attr('href'));
}

function processBootOptions(opts) {
	if(opts && "emulator-args" in opts) {
		var args = opts["emulator-args"];
		for(var arg in args) {
			emuState.getEmulatorInterface().setArgument(arg, args[arg]);
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
			navFetchDriveFromUrl(name, "hd1", param, true);
			break;
		case "boot-floppy":
			processBootOptions(opts);
			navFetchDriveFromUrl(name, "fd1", param, true);
			break;
		case "boot-rom":
			processBootOptions(opts);
			gaTrackEvent("disk-mounted", name);
			emuState.getEmulatorInterface().bootFromRom();
			break;
		case "floppy":
			if(emuState.isRunning()) {
				navFetchDriveFromUrl(name, (opts && opts.drive) ? opts.drive : "fd1", param, false);
			} else {
				alert("Please boot the computer using a boot disk first");
			}
			break;
		case "upload-floppy":
			gaTrackEvent("disk-mounted", "local-floppy");
			uploadFloppy("fd1", true);
			break;
		case "download-floppy":
			downloadFloppy("fd1");
			break;
		case "download-file":
			downloadFile(param);
			break;
		case "upload-file":
			uploadFile(param, "cassette file (.cas)");
			break;
		case "get-file":
			getFileFromUrl(param, opts.saveAs);
			break;
		case "cassette":
			cassetteAction(param);
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

function promptNavigatorUrl () {
	var example = "http://example.com/index.wiki";
	var url = window.prompt("Please enter a URL to a RetroWeb file", example);
	if (url & url != example) {
		navTo(url);
	}
}

function navFetchDriveFromUrl(name, drive, url, isBootable) {
	gaTrackEvent("disk-mounted", name);
	mountDriveFromUrl(drive, navigatorPage.rewriteRelativeUrl(url), isBootable);
}