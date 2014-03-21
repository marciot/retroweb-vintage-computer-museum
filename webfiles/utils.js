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
	if (endsWith(filename, ".js") || endsWith(filename, ".js.gz")){
		//if filename is a external JavaScript file
		var fileref = document.createElement('script')
		fileref.setAttribute("type","text/javascript")
		fileref.setAttribute("src", filename)
		if(async) {
			fileref.setAttribute("async", "async")
		}
	} else if (endsWith(filename, ".css") || endsWith(filename, ".css.gz")) {
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
		throw new Exception("toggleElementDisplay: No element " + id);
		return;
	}
	if(showIt) {
		element.style.display = 'block';
	} else {
		element.style.display = 'none';
	}
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var keyQueue = [];
var strKey = "~!@#$%^&*()_+{}|:<>?\"";
var strVal = "`1234567890-=[]\;,./\'";

function sendKeyEvent() {
	var next = keyQueue.shift();
	simulateKeyAction(next[0],next[1],next[2],next[3]);
	if(keyQueue.length) {
		setTimeout(sendKeyEvent, 10);
	}
}

function isUpperCase(c) {
	return c === c.toUpperCase() && c !== c.toLowerCase();
}

/* This function allows you to send keycodes to the emulator
 */
function typeString(str) {
	var shiftDown = false;
	for(i = 0; i<str.length; i++) {
		var c = str.charAt(i);
		
		if(c == '\n') {
			cK = '\x0d';
			c = '\n';
			shifted = false;
		} else {
			var mapped = strKey.indexOf(c);
			var shifted = false;
			if (mapped != -1) {
				cK = strVal.charAt(mapped);
				shifted = true;
			} else {
				var cK = c.toUpperCase()
				shifted = isUpperCase(c);
			}
		}
		if(shifted && !shiftDown) {
			keyQueue.push(['keydown','\x10',0,false]);
			shiftDown = true;
		} else if(!shifted && shiftDown) {
			keyQueue.push(['keyup','\x10',0,false]);
			shiftDown = false;
		}
		keyQueue.push(['keydown',cK,c,shiftDown]);
		keyQueue.push(['keypress',cK,c,shiftDown]);
		keyQueue.push(['keyup',cK,c,shiftDown]);
	}
	if(shiftDown) {
		keyQueue.push(['keyup','\x10',0,false]);
		shiftDown = false;
	}
	if(keyQueue.length) {
		setTimeout(sendKeyEvent, 10);
	}
}

function simulateKeyAction(type, keyCode, charCode, shifted) {
    /*var evt       = document.createEvent('KeyboardEvent');
	
    // Chromium Hack
    Object.defineProperty(evt, 'keyCode', {get : function() {return keyCode;}});
    Object.defineProperty(evt, 'which',   {get : function() {return keyCode;}});

    if (evt.initKeyboardEvent) {
        evt.initKeyboardEvent(type, true, true, document.defaultView, false, false, false, false, keyCode, charCode);
    } else {
        evt.initKeyEvent(type, true, true, document.defaultView, false, false, false, false, keyCode, 0);
    }

    if (evt.keyCode !== keyCode) {
        alert("keyCode mismatch " + evt.keyCode + "(" + evt.which + ")");
    }
	
    if (evt.charCode !== charCode) {
        alert("charCode mismatch " + evt.charCode + "(" + evt.which + ")");
    }*/
	
	var evt = window.crossBrowser_initKeyboardEvent(type, {"key": keyCode, "char": charCode, "shiftKey" : shifted});
    document.dispatchEvent(evt);
}