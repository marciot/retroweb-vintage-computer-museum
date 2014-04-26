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

/* JQuery regular expression selector from:
 *   http://james.padolsey.com/javascript/regex-selector-for-jquery/
 */
jQuery.expr[':'].regex = function(elem, index, match) {
    var matchParams = match[3].split(','),
        validLabels = /^(data|css):/,
        attr = {
            method: matchParams[0].match(validLabels) ? 
                        matchParams[0].split(':')[0] : 'attr',
            property: matchParams.shift().replace(validLabels,'')
        },
        regexFlags = 'ig',
        regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g,''), regexFlags);
    return regex.test(jQuery(elem)[attr.method](attr.property));
}

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
	if (document.selection) {
		var range = document.body.createTextRange();
		range.moveToElementText(element);
		range.select();
	} else if (window.getSelection) {
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
		callback(references[i], arg);
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
 * of the bubble from an element elsewhere in the
 * document (such as in a glossary). Example:
 *
 *    <span class="term">dog</span>
 *    <span class="term">cat</span>
 *    ...
 *    <li id="define_dog">Dog: An animal that drools</li>
 *    <li id="define_cat">Cat: An animal that rules</li>
 *
 * A call to attachBubbles("term", "define_") would
 * create floating bubbles defining each term.
 */
function attachBubbles(refClass, callback) {
	forEachElementInClass(refClass, function(ref) {
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

function adjustBubble(bubble, container) {
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
function HintManager(element) {
	element.hintManager = this;
	this.curHint = 0;
	$(element).children("LI:first").show();
	
	this.nextHint = function() {
		var hints = $(element).children("LI");
		$(hints[this.curHint]).hide();
		this.curHint = (this.curHint + 1) % hints.length;
		$(hints[this.curHint]).show();
	}
	
	if($(element).children("LI").length > 1) {
		var title = (element.className == "trivia") ? "More trivia" : "More hints";
		
		$("<input type='button' value='" + title + "'>")
			.click(function() {this.parentNode.hintManager.nextHint();})
			.prependTo(element);
	}
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
	$('<a class="show-target" target="references">Show References</a>')
		.insertBefore("#references");
}

function attachHintManagers() {
	$(".hints,.trivia").each(function(i,el) {new HintManager(el)});
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

function applyClassSetters() {
	$("DIV:regex(class,^set-class-)").each(function(i,e) {
		var className = e.className.substring(10);
		$(e).children().addClass(className);
	});
}

/* Applies all dynamic formatting to the page
 */
function applyDynamicFormatting(emulator) {
	implicitClassNames();
	applyClassSetters();
	implicitShowTarget();
	defineGlossaryTerms();
	declareReferences();
	activateShowTargetElements();
	attachHintManagers();
	attachBubbleAdjustment();
	
	// Adjust bubbles does not works when the bubbles are hidden,
	// so show the DIV before calling it
	showEmulatorDiv(emulator);
	adjustBubbles();
}