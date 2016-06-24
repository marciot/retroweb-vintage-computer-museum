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

/* onChange handler for the emulator drop-down menu */
function onEmulatorChange() {
	var emulatorMenu = document.getElementById('emulator-select');
	navTo("/?emulator=" + emulatorMenu.options[emulatorMenu.selectedIndex].value);
}

function fetchDataFromUrl (url, callback) {
	$.ajax({
		url: url,
		success: function (data) {
			try {
				callback(data);
			} catch (e) {
				alert ("Error processing response from " + url + ": " + e.message );
				throw e;
			}
		},
		error: function(jqXHR,textStatus) {
			alert("Error fetching " + url + ":" + textStatus);
		}
	});
}

function LoadException(message) {
   this.message = message;
   this.name = "LoadException";
}

function loadEmulatorChoices(json) {	
	return ;
}

function loadEmulatorConfig(json, emulator) {
	var startupConfig = json["startup-config"];
	emuState.setEmulator(emulator);
	emulatorConfig = startupConfig.emulators[emulator];
	
	if (emulatorConfig == undefined) {
		throw new LoadException ("The startup.json file does not contain a stanza corresponding to this emulator");
	}
		
	var dirsToMake = emulatorConfig["mkdir"];
	if(dirsToMake) {
		for (var i = 0; i < dirsToMake.length; ++i) {
			var path = dirsToMake[i];
			fileManager.makeDir(path);
		}
	}
	
	function filePart(path) {
		return path.substr(path.lastIndexOf("/")+1);
	}
		
	var filesToMount = emulatorConfig["preload-files"];
	for (var i = 0; i < filesToMount.length; ++i) {
		if (filesToMount[i].charAt(0) == '#') continue;
		var parts = filesToMount[i].split(/\s+->\s+/);
		var url = parts[0];
		var name = (parts.length > 1) ? parts[1] : filePart(parts[0]);
		fileManager.writeFileFromUrl('/' + name, url);
	}
	emuState.romsLoaded();
	emuState.configLoaded(startupConfig);
}

function processStartupConfig(json) {
	var startupConfig = json["startup-config"];
	if (
		typeof startupConfig == 'undefined' ||
		typeof startupConfig.version == 'undefined' ||
		typeof startupConfig.emulators == 'undefined'
	) {
		throw new LoadException ("Index fails startup-config JSON format validation");
	}
	
	var chosenEmulator = RetroWeb.query.platform || RetroWeb.query.emulator || chooseEmulator();
	
	loadEmulatorConfig(json, chosenEmulator);
	
	navInitialDoc();
}

/* This object handles visibility transitions from one object to the next
 */
function TransitionManager() {
	this.visibleElement;
	this.speed = 0;
	this.allowConcurrent = false;
	
	this.makeVisible = function(el,speed) {
		if(el == this.visibleElement) {
			return;
		}
		if(typeof speed == 'undefined') {
			speed = this.speed;
		}
		if(this.visibleElement && el) {
			if(this.allowConcurrent) {
				$(this.visibleElement).fadeOut(speed);
				$(el).fadeIn(speed);
			} else {
				$(this.visibleElement).fadeOut(speed,
					function() {$(el).fadeIn(speed);});
			}
		} else if(this.visibleElement && !el) {
			$(this.visibleElement).fadeOut(speed);
		} else {
			$(el).fadeIn(speed);
		}
		this.visibleElement = el;
	}
	
	this.setSpeed = function(speed, allowConcurrent) {
		this.speed = speed;
		this.allowConcurrent = allowConcurrent;
	}
}

/* This object manages popup dialog boxes. Since our pop-up boxes are translucent,
 * this object ensures that only the topmost popup box is visible at once.
 */
function PopupManager(tm) {
	this.transitionManager = tm;
	this.popupBoxes = new Array();
	
	this.add = function(id) {
		this.popupBoxes.push({"id" : id, "open" : false});
	};
	this.setState = function(id, state) {
		for (var i = 0; i < this.popupBoxes.length; ++i) {
			if (id == this.popupBoxes[i].id) {
				this.popupBoxes[i].open = state;
			}
		}
	};
	this.apply = function(speed) {
		var topmost;
		for (var i = 0; i < this.popupBoxes.length; ++i) {
			if (this.popupBoxes[i].open) {
				topmost = this.popupBoxes[i].id;
			}
		}
		tm.makeVisible(document.getElementById(topmost),speed);
	}
	this.open = function(id,speed) {
		this.setState(id, true);
		this.apply(speed);
	};
	this.close = function(id, speed) {
		this.setState(id, false);
		this.apply(speed);
	};
}

/* This object saves the contents of a DOM element so that it can be restored
 * later.
 */
function StateSnapshot(id) {
	this.state = null;
	this.what_id = id;
	this.capture = function() {
		this.state = document.getElementById(this.what_id).cloneNode(true);
		return this;
	};
	this.restore = function() {
		var element = document.getElementById(this.what_id);
		var parent = element.parentNode;
		parent.replaceChild(this.state.cloneNode(true), element);
	};
	return this;
}