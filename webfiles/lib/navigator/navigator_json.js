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

/* JSON can be used as a compact representation for icons. This function converts
 * an array of the form:
 *
 *	[
 *		["label",  "data-type", "href"],
 *		["label",  "data-type", "href", {"className": "class"}],
 *		["label",  "data-type", "href", {"option": "value"}],
 *	]
 *
 * Into a series of anchors:
 *
 *	<a href="href" data-type="data-type">label</a>
 *	<a href="href" data-type="data-type" class="class" data-cfg='{"className": "class"}'>label</a>
 *	<a href="href" data-type="data-type" class="class" data-cfg='{"option": "value"}'>label</a>
 *
 */
function expandJSONIconArrayToAnchors(doc, jsonIcons, containerElement) {
	for (var i = 0; i < jsonIcons.length; ++i) {
		var name = jsonIcons[i][0];
		var type = jsonIcons[i][1];
		var arg  = jsonIcons[i][2];
		var opts = jsonIcons[i][3];
		var icon = doc.createElement( "A" );
		if( opts && opts.hasOwnProperty("className") ) {
			icon.className = opts.className;
		}
		icon.appendChild(doc.createTextNode(name));
		if(type) icon.setAttribute("data-type", type);
		if(opts) icon.setAttribute("data-cfg", JSON.stringify(opts));
		if(arg)  icon.setAttribute("href", arg);
		containerElement.appendChild(icon);
	}
}


/* JSON can be used as a compact representation for icons. The format is as such:
 * 
 *	{
 *		"icons" : [
 *			["label",  "data-type", "href"],
 *			["label",  "data-type", "href"],
 *			["label",  "data-type", "href", {"option": "value"}],
 *		]
 *	}
 *
 * This function emits anchors nested in an x-icons element for subsequent processing.
 */
function processJSONIcons( doc, json ) {
	var icons = doc.createElement("x-icons");
	if(json.hasOwnProperty("class")) {
		icons.className = json["class"];
	}
	expandJSONIconArrayToAnchors(doc, json.icons, icons);
	return icons;
}

/* A JSON block with a value of "emulators" will indicate what emulators are compatible with a page.
 * If the current page is not running that emulator, the page will be refreshed with that emulator.
 *
 *	{"emulators" : ["sae-amiga"]}
 */
function processJSONEmulators( docs, json ) {
	if(json.emulators.indexOf(emuState.getEmulator()) == -1 && !RetroWeb.query.emulator) {
		navTo("?emulator=" + json.emulators[0], 'redirect');
	}
}

/* JSON allow for a more compact representation of arbitrary structured data
 * than HTML tags:
 *
 *   {
 *      "label" : "value",
 *      "label": [ "array", "array" ]
 *      ...
 *   }
 *
 * The wikify function wraps such blocks in a  SCRIPT tag of type="application/javascript".
 * Here we find all such tags and call the respective processing function to convert them
 * into DOM elements.
 */
function processJSONContent(doc, element) {
	$('SCRIPT[type="application/json"]', element).replaceWith(
		function() {
			var json = JSON.parse($(this).html());
			if(json.hasOwnProperty("emulators")) {
				return processJSONEmulators(doc, json);
			}
			if(json.hasOwnProperty("icons")) {
				return processJSONIcons(doc, json);
			}
		}
	);
}
