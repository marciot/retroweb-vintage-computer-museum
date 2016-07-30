/* HACK: Put classes in separate file since googlebot does not support them */

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

/* This object manages hints on a webpage
 */
class HintManager {
	constructor(element) {
		this.curHint = 0;
		this.element = element;

		element.hintManager = this;
		element.querySelector("LI").classList.add('visible');

		if(this.element.querySelectorAll("LI").length > 1) {
			var title = (element.className == "trivia") ? "More trivia" : "More hints";
			var btn   = document.createElement('input');
			btn.type  = 'button';
			btn.value = title;
			btn.addEventListener('click',function() {element.hintManager.nextHint();});

			var listEl = element.querySelector("ol");
			listEl.insertBefore(btn, listEl.firstChild);
		}
	}

	nextHint() {
		var hints = this.element.querySelectorAll("LI");
		hints[this.curHint].classList.remove('visible');
		this.curHint = (this.curHint + 1) % hints.length;
		hints[this.curHint].classList.add('visible');
	}
}