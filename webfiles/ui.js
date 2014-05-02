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

function EmulatorState() {
	this.emuName = null;
	this.startupConfig = null;
	this.emuIfce = null;
	
	this.loaded = false;
	this.running = false;
	this.gotRoms = false;
	this.gotBootMedia = false;
	this.floppyDrives = new Array();
	
	this.setEmulator = function (emulator) {
		this.emuName = emulator;
	}

	this.getEmulator = function() {
		return this.emuName;
	}
	
	this.setEmulatorInterface = function(ifce) {
		this.emuIfce = ifce;
	}
	
	this.getEmulatorInterface = function() {
		return this.emuIfce;
	}
	
	this.getInitialDoc = function () {
		return this.getConfig["initial-doc"] || this.startupConfig["initial-doc"];
	}
	
	this.getConfig = function () {
		return this.startupConfig.emulators[this.emuName];
	}
	
	this.waitForMedia = function(fileName, isBootable) {
		showStatus("Loading...");
		var me = this;
		var waitFunc = function(remaining, depName) {
			if(isBootable && depName == fileName) {
				me.bootMediaLoaded();
			}
			if(remaining == 0) {
				if(me.running) {
					me.syncEmscriptenFS(true); 
				} else if(me.gotBootMedia) {
					me.requestRestart();
				}
				showStatus(false);
			}
		}
		fileManager.setFileReadyCallback(waitFunc);
	}
	
	this.start = function() {
		fetchDataFromUrl("/startup.json", processStartupConfig);
		navAddPopStateHandler();
	}
	
	this.configLoaded = function(config) {
		this.startupConfig = config;
		navInitialDoc();
		loadEmulatorResources();
		if(!this.gotRoms) {
			popups.open("popup-rom-missing");
		}
	}
	
	this.syncEmscriptenFS = function(doMount) {
		var filesWritten = fileManager.syncEmscriptenFS(FS);
		console.log("Preparing disks...");
		for(var i = 0; i < filesWritten.length; i++) {
			emuState.getEmulatorInterface().prepareDisk(filesWritten[i]);
			if(doMount) {
				emuState.getEmulatorInterface().mountDisk(filesWritten[i]);
			}
		}
	}
	
	this.emscriptenPreInit = function() {
		popups.close("popup-status");
		this.syncEmscriptenFS(false);
	}
	
	this.emscriptenPreRun = function() {
		emuState.getEmulatorInterface().preRun();
		this.running = true;
	}
	
	this.romsLoaded = function() {
		this.gotRoms = true;
		popups.close("popup-rom-missing");
		popups.open("popup-need-boot-media");
	}
	this.bootMediaLoaded = function() {
		this.gotBootMedia = true;
		popups.close("popup-need-boot-media");
	}
	this.requestRestart = function() {
		if (!this.gotRoms || !this.gotBootMedia) {
			return;
		}
		if (!this.loaded) {
			showStatus("Starting emulator...");
			// Need to delay a bit otherwise the status will not update
			setTimeout(loadEmulator, 100);
			this.loaded = true;
		} else if(this.running) {
			emuState.getEmulatorInterface().reset();
		}
	}
	this.isRunning = function() {
		return this.running;
	}
	this.floppyMounted = function(fname) {
		if( !(fname in this.floppyDrives)) {
			this.floppyDrives[fname] = {};
		}
		this.floppyDrives[fname].mounted = true;
	}
	this.isFloppyMounted = function(fname) {
		return this.floppyDrives.hasOwnProperty(fname) ? this.floppyDrives[fname].mounted : false;
	}
}

function createEmscriptenModule() {
	var statusElement = document.getElementById('status');
	var progressElement = document.getElementById('progress');
	var macStatus = document.getElementById('popup-status');
	var module = {
		preRun: [function () {emuState.emscriptenPreRun();}],
		postRun: [],
		preInit: [function () {emuState.emscriptenPreInit();}],
		arguments: [],
		noInitialRun: false,
		print: function(text) {
			text = Array.prototype.slice.call(arguments).join(' ');
			console.log(text);
		},
		printErr: function(text) {
			text = Array.prototype.slice.call(arguments).join(' ');
			console.log(text);
		},
		canvas: document.getElementById('screen'),
		setStatus: function(text) {console.log("Emscripten Status Update: " + text);},
		totalDependencies: 0,
		monitorRunDependencies: function(left) {
			if(left > 0) {
				popups.open("popup-status");
			} else {
				popups.close("popup-status");
			}
		}
	};
	return module;
}

function loadEmulatorResources() {
	console.log("Loading emulator resources");
	var config = emuState.getConfig();
	for(var i = 0; i < config.pre.length; i++) {
		loadResource(config.pre[i], true);
	}
}

function loadEmulator() {
	console.log("Loading emulator scripts");
	var config = emuState.getConfig();
	Module = createEmscriptenModule();
	emuState.getEmulatorInterface().configModule(Module);
	for(var i = 0; i < config.run.length; i++) {
		loadResource(config.run[i], true);
	}
}

function restartComputer() {
	emuState.requestRestart();
}

/* Emulator drop-down menu */
function addEmulator(emulator, title) {
	var label  = document.createTextNode(title);
	var option = document.createElement("option");
	option.appendChild(label);
	option.value = emulator;
	document.getElementById("emulator-select").appendChild(option);
}

/* onChange handler for the emulator drop-down menu */
function onEmulatorChange() {
	var emulatorMenu = document.getElementById('emulator-select');
	var newEmulator = "emulator=" + emulatorMenu.options[emulatorMenu.selectedIndex].value;
	var newPage = new String(window.location);
	if(newPage.indexOf("?") != -1) {
		newPage = newPage.replace(/(platform|emulator)=[a-zA-Z0-9-]+/i, newEmulator);
	} else {
		newPage = newPage + "?" + newEmulator;
	}
	window.location = newPage;
}

function fetchDataFromUrl (url, callback) {
	$.ajax({
		url: url,
		success: function (data) {
			try {
				callback(data);
			} catch (e) {
				alert ("Error processing response from " + url + ": " + e.message );
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

function processStartupConfig(json) {
	var startupConfig = json["startup-config"];
	if (
		typeof startupConfig == 'undefined' ||
		typeof startupConfig.version == 'undefined' ||
		typeof startupConfig.emulators == 'undefined'
	) {
		throw new LoadException ("Index fails startup-config JSON format validation");
	}
	
	var emulators = [];
	for(e in startupConfig.emulators) {
		startupConfig.emulators[e].key = e;
		emulators.push(startupConfig.emulators[e]);
	}
	emulators.sort(function(a,b){return a.name.localeCompare(b.name);});
	for(var i = 0; i < emulators.length; ++i) {
		addEmulator(emulators[i].key, emulators[i].name);
	}
	
	var emulator = query.platform || query.emulator || emulators[Math.floor((Math.random()*emulators.length))].key;
	
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

function showStatus(text) {
	var statusElement = document.getElementById('status');
	if (!text) {
		popups.close("popup-status");
	} else {
		statusElement.innerHTML = text;
		popups.open("popup-status");
	}
}

/* File management - Most of the heavy-lifting is done by the EmscriptenFileManager object */

function mountDriveFromUrl(drive, url, isBootable) {
	var dstName = emuState.getEmulatorInterface().getFileNameForDrive(drive, url);
	fileManager.writeFileFromUrl(dstName, url, isBootable);
	emuState.waitForMedia(dstName, isBootable);
}

function uploadFloppy(drive, isBootable) {
	if(!window.FileReader) {
		// Browser is not compatible
		alert("Your web browser does not support this feature");
		return;
	}
	document.getElementById('uploader-text').innerHTML = "Select floppy disk image";
	document.getElementById('uploader-ok-btn').onclick = function(evt) {
		popups.close("popup-uploader");
		
		var file = document.getElementById('uploader-file').files[0];
		var dstName = emuState.getEmulatorInterface().getFileNameForDrive(drive, file.name);
		
		fileManager.writeFileFromFile(dstName, file);
		emuState.waitForMedia(dstName, isBootable);
		return false;
	}
	popups.open("popup-uploader");
}

function downloadFloppy(drive) {
	var fileName = emuState.getEmulatorInterface().getFileNameForDrive(drive, null);
	if(typeof FS == 'undefined') {
		alert("The emulator must be initialized");
		return;
	}	
	saveEmscriptenFile(FS, fileName);
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