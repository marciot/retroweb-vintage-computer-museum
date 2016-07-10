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
 *	<a href="href" data-type="data-type" class="class" data-json='{"className": "class"}'>label</a>
 *	<a href="href" data-type="data-type" class="class" data-json='{"option": "value"}'>label</a>
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
		if(opts) icon.setAttribute("data-json", JSON.stringify(opts));
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
 * This function emits anchors nested in an file-icons element for subsequent processing.
 */
function processJSONIcons( doc, json ) {
	var icons = doc.createElement("file-icons");
	if(json.hasOwnProperty("class")) {
		icons.className = json["class"];
	} else {
		// If there are no className specified, automatically float right
		// when there are one or two icons.
		if(json.icons.length < 3) {
			icons.className = "float-right";
		}
	}
	expandJSONIconArrayToAnchors(doc, json.icons, icons);
	icons.update();
	return icons;
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
 * The wikify function wraps such blocks in a SCRIPT tag of type="application/javascript".
 * Here we find all such tags and call the respective processing function to convert them
 * into DOM elements.
 */
function processJSONContent(doc, element) {
	var els = element.querySelectorAll('SCRIPT[type="application/json"]');
	for(var i =0; i < els.length; i++) {
		var json = JSON.parse(els[i].textContent);
		if(json.hasOwnProperty("icons")) {
			els[i].parentNode.replaceChild(processJSONIcons(doc, json), els[i]);
		} else {
			els[i].remove();
		}
	}
}
