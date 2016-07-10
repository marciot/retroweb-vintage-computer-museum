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

/* Selects the text inside an element
 */
function selectText(element) {
	if (window.getSelection) {
		var range = document.createRange();
		range.selectNodeContents(element);
		var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
	}
}

/* Inserts an element after another in the DOM
 */
function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/* Calls a function for each DOM element having the specified className
 */
function forEachElementInClass(className, callback, arg) {
	var references = document.getElementsByClassName(className);
	for (i = 0; i < references.length; ++i) {
		callback(references[i], i, arg);
	}
}

/* Takes a DOM element and strips out everything but the text, similar
 * to innerHTML, but without including tags.
 */
function elementToString(element) {
	var str = "";
	switch(element.nodeType) {
		case Node.ELEMENT_NODE:
			for(var i = 0; i < element.childNodes.length; ++i) {
				str += elementToString(element.childNodes[i]);
			}
			break;
		case Node.TEXT_NODE:
			str += element.nodeValue;
			break;
	}
	return str;
}

/* This function attaches an bubble to an element in the DOM */
function createBubble(element, text) {
	var bubbleTail  = document.createElement("span");
	var bubbleBody  = document.createElement("span");
	bubbleTail.className = "bubble-tail";
	bubbleBody.className = "bubble-body";
	bubbleBody.appendChild(document.createTextNode(text));
	element.appendChild(bubbleBody);
	element.appendChild(bubbleTail);
	element.className   += " bubble";
	element.style.cursor = "pointer";
}

/* This function attaches bubbles to elements of a
 * particular class while retrieving the contents
 * of the bubble from a callback.
 */
function attachBubbles(refClass, callback) {
	forEachElementInClass(refClass, function(ref, i) {
		var anchor = "citation_" + i;

		var footHtml = callback(ref.innerHTML);
		if(footHtml) {
			bubbleText = elementToString(footHtml);
		} else {
			bubbleText = "Footnote not found";
		}
		createBubble(ref, bubbleText);

		// Make it so clicking the reference highlights the reference
		ref.onclick = function() {
			var parent = footHtml.parentNode;
			setVisibility(parent, true);
			selectText(footHtml);
		}
		ref.href = "#" + anchor;

		var footnote = document.createElement('a');
		footnote.name = anchor;
		footHtml.insertBefore(footnote, footHtml.firstChild);
	});
}

function getElementOverhang(element, container) {
	var elementBounds   = element.getBoundingClientRect();
	var containerBounds = container.getBoundingClientRect();
	
	if(containerBounds.right - containerBounds.left == 0) {
		return 0;
	}
	
	var overhang = 0;
	if (elementBounds.right > containerBounds.right) {
		overhang = elementBounds.right - containerBounds.right;
	} else if (elementBounds.left < containerBounds.left) {
		overhang = elementBounds.left - containerBounds.left;
	}
	return overhang;
}

function adjustBubble(bubble, i, container) {
	var oldDisplay = bubble.style.display;	
	bubble.style.display = 'inline';
	var overhang = getElementOverhang(bubble, container);
	if(overhang > 0) {
		bubble.style.left = bubble.offsetLeft - overhang;
	} else {
		bubble.style.left = -20;
	}
	bubble.style.display = oldDisplay;
}

function adjustBubbles() {
	forEachElementInClass("bubble-body", adjustBubble,
		document.getElementsByTagName("BODY")[0]);
}

function attachBubbleAdjustment() {
	window.addEventListener("resize", adjustBubbles, false);
}

/* Sets the visibility of an element. In the case in which the
 * element's visibility is controlled by a "show-target" anchor
 * (see below), this function also toggles the anchor's visibility.
 */ 
function setVisibility(element, visibility) {
	if(typeof element == "string") {
		element = document.getElementById(id);
	}
	if(element) {
		if(element.togglePeer) {
			element.togglePeer.style.display = visibility ? 'none' : 'block';
		}
		element.style.display = visibility ? 'block' : 'none';
	}
}

/* This function searches the document for anchor tags of class
 * "show-targets" and makes it so it controls the visibility of
 * the element, indicated by the target attribute.
 */
function activateShowTargetElements() {
	forEachElementInClass("show-target", function(ref) {
		var target = document.getElementById(ref.target);
		ref.onclick = function () {
			target.style.display = 'block';
			ref.style.display = 'none';
		};
		ref.className += " no-select";
		target.style.display = 'none';
		target.togglePeer = ref;
	});
}

/* This object manages hints on a webpage
 */
var HintManager;

if(!HintManager) {
	/* Classes have difficulties getting multiply defined, so we put a guard here */
	HintManager = class {
		constructor(element) {
			this.curHint = 0;
			this.element = element;

			console.log(element.innerHTML);
			element.hintManager = this;
			element.querySelector("LI").style.display = 'block';

			if(this.element.querySelectorAll("LI").length > 1) {
				var title = (element.className == "trivia") ? "More trivia" : "More hints";
				var btn   = document.createElement('input');
				btn.type  = 'button';
				btn.value = title;
				btn.addEventListener('click',function() {this.parentNode.hintManager.nextHint();});
				element.insertBefore(btn, element.firstChild);
			}
		}

		nextHint() {
			var hints = this.element.querySelectorAll("LI");
			hints[this.curHint].style.display = 'none';
			this.curHint = (this.curHint + 1) % hints.length;
			hints[this.curHint].style.display = 'block';
		}
	}
} else {
	console.log("TODO: Fix multiple includes of docs.js");
}

function implicitClassNames() {
	for(var i = 1; i <= 6; ++i) {
		$("H" + i + ":contains('References')")
			.nextAll("ol:first").attr("id", "references");
	}
}

function implicitShowTarget() {	
	$('<a class="show-target" target="glossary">Show Glossary</a>')
		.insertBefore("#glossary");
}

function attachHintManagers(el) {
	var els = el.querySelectorAll(".hints,.trivia");
	for(var i = 0; i < els.length; i++) {
		new HintManager(els[i]);
	}
}

function defineGlossaryTerms() {
	attachBubbles("glossary_term",
		function(ref) {
			var elem;
			$("#glossary DT").each(function(i,e) {
				if(e.innerHTML.toLowerCase() == ref.toLowerCase()) {
					elem = e;
				}
			});
			return $(elem).nextAll("DD:first")[0];
		}
	);
}

function declareReferences() {
	attachBubbles("reference",
		function(ref) {
			return $("#references LI")[parseInt(ref.match(/\d+/))-1];
		}
	);
}

function showEmulatorDiv(emulator) {
	$("." + emulator).show();
}

/* Applies all dynamic formatting to the page
 */
function applyDynamicFormatting(el, emulator) {
	implicitClassNames();
	implicitShowTarget();
	defineGlossaryTerms();
	declareReferences();
	activateShowTargetElements();
	attachHintManagers(el);
	attachBubbleAdjustment();
	
	// Adjust bubbles does not works when the bubbles are hidden,
	// so show the DIV before calling it
	showEmulatorDiv(emulator);
	adjustBubbles();
}