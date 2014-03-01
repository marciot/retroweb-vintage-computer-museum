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

/* Get a query variable
 *
 * Reference:
 *    http://css-tricks.com/snippets/javascript/get-url-variables/
 */
function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if(pair[0] == variable) {
			return pair[1];
		}
	}
	return false;
}

/* Dynamically load a css or js object
 * 
 * Examples:
 *    loadResource("myscript.js")
 *    loadResource("mystyle.css")
 *
 *  Reference:
 *    http://www.javascriptkit.com/javatutors/loadjavascriptcss.shtml
 */
function loadResource(filename, async){
	if (endsWith(filename, ".js")){
		//if filename is a external JavaScript file
		var fileref = document.createElement('script')
		fileref.setAttribute("type","text/javascript")
		fileref.setAttribute("src", filename)
		if(async) {
			fileref.setAttribute("async", "async")
		}
	} else if (endsWith(filename, ".css")) {
		//if filename is an external CSS file
		var fileref = document.createElement("link")
		fileref.setAttribute("rel", "stylesheet")
		fileref.setAttribute("type", "text/css")
		fileref.setAttribute("href", filename)
	}
	if (typeof fileref != "undefined") {
		document.getElementsByTagName("head")[0].appendChild(fileref)
	}
}

/* Shows/hide an element. When hidden it does not take any
 * space in the layout.
 */
function toggleElementDisplay (id, showIt) {
	var element = document.getElementById(id);
	if(!element) {
		alert("toggleElementDisplay: No element " + id);
		return;
	}
	if(showIt) {
		document.getElementById(id).style.display = 'block';
	} else {
		document.getElementById(id).style.display = 'none';
	}
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/* This object manages hints on a webpage
 */
function HintManager(prefix) {
	if(prefix) {
		this.prefix = prefix;
	} else {
		this.prefix = "hint-";
	}
	this.curHint = 1;
	this.firstHint = document.getElementById(this.prefix + "1");
	this.firstHint.style.display = 'block';
			
	this.nextHint = function() {
		var thisHint = document.getElementById(this.prefix + this.curHint++);
		var nextHint = document.getElementById(this.prefix + this.curHint);
		if (!nextHint) {
			this.curHint = 1;
			nextHint = this.firstHint;
		}
		thisHint.style.display = 'none';
		nextHint.style.display = 'block';
	}
}