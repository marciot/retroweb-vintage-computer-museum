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

/* This script uses document.write to inject boilerplate code that is needed
 * to start the RetroWeb interface. This keeps the pages for individual articles
 * as minimal as possible.
 *
 * Loading the webcomponents polyfill (for compatibility with iOS browsers)
 * followed by HTML imports ensures proper sequence of code execution. While
 * it is tempting to nest HTML imports inside HTML imports, I have found that
 * this leads to race conditions when using webcomponents and it is preferable
 * to do all HTML imports here. CSS imports do not have this limitation and
 * can be imported where most convenient.
 */
 
 (function(namespace){
	/* Decode the query variable */
	function parseQuery(url) {
		var vars = (url || window.location.search).substring(1).split("&");
		var query = {};
		for (var i=0;i<vars.length;i++) {
			var pair = vars[i].split("=");
			query[pair[0]] = pair[1];
		}
		return query;
	}
	
	namespace.query = parseQuery();
	
	/* The following hides the retroweb-markup. The reason we do this from JavaScript
	   is that we want the content to be visible if the user has disabled JavaScript. */
	if(!(RetroWeb.query.debug == "raw")) {
		var style = document.createElement("style");
		style.appendChild(document.createTextNode(""));
		document.head.appendChild(style);
		style.sheet.insertRule("#retroweb-markup { display: none }", 0);
	}

	/* However, if Javascript fails, show the original content. This allows Googlebot to
	   crawl the content regardless of Javascript errors. Uncommenting document.write lets
	   me see the error in Google's search dashboard, but I am unable to make it work.
	   */
	window.onerror = function(error) {
		//document.write(error);
		style.remove();
	};
})(window.RetroWeb = window.RetroWeb || {});

if(!(RetroWeb.query.debug == "raw")) {
	//document.write('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
	document.write('<script type="text/javascript" src="http://code.jquery.com/jquery-1.12.4.min.js"></script>');
	document.write('<script type="text/javascript" src="/lib/webcomponents/webcomponents.min.js"></script>');
	document.write('<link rel="import" href="/components/inline-svg.html"></link>');
	document.write('<link rel="import" href="/components/animated-zoom.html"></link>');
	document.write('<link rel="import" href="/components/emulator-skin.html"></link>');
	document.write('<link rel="import" href="/components/emulator-buttons.html"></link>');
	document.write('<link rel="import" href="/components/emulator-popups.html"></link>');
	document.write('<link rel="import" href="/components/file-icons.html"></link>');
	document.write('<link rel="import" href="/emulators/emulator.html"></link>');
	document.write('<link rel="import" href="/lib/navigator/navigator.html"></link>');
	document.write('<link rel="import" href="/lib/retroweb-main.html"></link>');
}