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
	this.running = false;
	this.gotRom = false;
	this.gotBootMedia = false;
	
	addRunDependency("emu-roms");
	addRunDependency("boot-disk");
	popups.open("popup-rom-missing");
	
	this.runCalled = function() {
		this.running = true;
	}
	this.romsLoaded = function() {
		this.gotRoms = true;
		removeRunDependency("emu-roms");
		popups.close("popup-rom-missing");
		popups.open("popup-ready-to-use");
	}
	this.bootMediaLoaded = function() {
		removeRunDependency("boot-disk");
		popups.close("popup-ready-to-use");
	}
	this.requestRestart = function() {
		if (!this.romsLoaded || this.gotBootMedia) {
			return;
		}
		if(!this.running) {
			run();
		} else {
			emulatorReset();
		}
	}
	this.isRunning = function() {
		return this.running;
	}
}

var emulatorState;
var romFileName;
var emuPlatform;

function setPlatform(platform) {
	emuPlatform = platform;
}

function getPlatform() {
	return emuPlatform;
}

function preInit() {
	addRunDependency();
	fetchDataFromUrl("startup.json",
		function(content) {
			loadConfig(JSON.parse(content))
		}
	);
	emuState = new EmulatorState();
}

function preRun() {
	emulatorPreRun();
	emuState.runCalled();
}

function loadConfig(json) {
	var startupConfig = json["startup-config"];
	if (
		typeof startupConfig == 'undefined' ||
		typeof startupConfig.version == 'undefined'
	) {
		throw new LoadException ("Index fails startup-config JSON format validation");
	}
	
	platformConfig = startupConfig[getPlatform()];
	
	if (platformConfig == undefined) {
		throw new LoadException ("The startup.json file does not contain a stanza corresponding to this platform");
	}
	
	var dirsToMake = platformConfig["mkdir"];
	for (var i = 0; i < dirsToMake.length; ++i) {
		var path = dirsToMake[i];
		FS.mkdir (path);
		console.log("Creating directory " + path);
	}
		
	var filesToMount = platformConfig["mount-files"];
	for (var i = 0; i < filesToMount.length; ++i) {
		var parent = filesToMount[i][0];
		if (parent == "_disabled") continue;
		var name   = filesToMount[i][1];
		var url    = filesToMount[i][2];
		FS.createPreloadedFile (parent, name, url, 1, 1, null, function() {alert("Failed to load " + url);});
		console.log("Preloading " + url + " on " + parent + name);
	}
	if (!platformConfig["ask-for-rom"]) {
		emuState.romsLoaded();
	} else {
		romFileName = platformConfig["ask-for-rom"];
	}
	removeRunDependency();
}

function mountUrl(url, where, isBootable) {
	console.log("Mounting " + url + " on " + where);
	showStatus("Downloading...");
	var onLoad = function () {
		if (!emuState.isRunning()) {
			if (isBootable) {
				emuState.bootMediaLoaded();
			}
		} else {
			emulatorMountDisk(where);
		}
		showStatus(false);
	};
	var onErr = function () {
		showStatus(false);
		alert("Failed to load disk. Bummer!");
	};
	try {
		FS.unlink(where);
	} catch (err) {
	}
	FS.createPreloadedFile('/', where, url, 1, 1, onLoad, onErr);
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

/* Upload from local disk functionality */

function openFileUploader (message, callback) {
	document.getElementById('uploader-text').innerHTML = message;
	document.getElementById('uploader-ok-btn').onclick = function(evt) {
		callback(document.getElementById('uploaderfile').files[0]);
		return false;
	}
	popups.open("popup-uploader");
}

function doLocalUpload (file, path, callback) {
	if(!window.FileReader) return; // Browser is not compatible
	var reader = new FileReader();

    reader.onload = function(evt) {
        if(evt.target.readyState != 2) return;
        if(evt.target.error) {
			showStatus(false);
            alert('Error while reading file');
            return;
        }

        var filecontent =  new Uint8Array(evt.target.result);
		FS.writeFile(path, filecontent, { encoding: 'binary' });
		callback();
		showStatus(false);
    };
	showStatus("Loading...");
    reader.readAsArrayBuffer(file);
}

function doFloppyUpload (file) {
	if(!file) return;
	popups.close("popup-uploader");
	doLocalUpload(file, "/fd1.disk", function() {
		emulatorMountDisk("fd1.disk");
	});
}

function doRomUpload (file) {
	if(!file) return;
	popups.close("popup-uploader");
	doLocalUpload(file, romFileName, function() {
		emuState.romsLoaded();
	});
}

function restartComputer() {
	emuState.requestRestart();
}

/* This object manages popup dialog boxes. Since our pop-up boxes are translucent,
 * this object ensures that only the topmost popup box is visible at once.
 */
function PopupManager() {
	this.popupBoxes = new Array();
	
	this.add = function(id) {
		this.popupBoxes.push({"id" : id, "open" : false});
	};
	this.setState = function(id, state) {
		var topmost = null;
		for (var i = 0; i < this.popupBoxes.length; ++i) {
			if (id == this.popupBoxes[i].id) {
				this.popupBoxes[i].open = state;
			}
			if (this.popupBoxes[i].open) {
				topmost = i;
			}
		}
		for (var i = 0; i < this.popupBoxes.length; ++i) {
			toggleElementDisplay(this.popupBoxes[i].id, i == topmost);
		}
	};
	this.open = function(id) {
		this.setState(id, true);
	};
	this.close = function(id) {
		this.setState(id, false);
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

function showHtmlViewer(url) {
	if(url) {
		document.getElementById("html-iframe").src = url + "?platform=" + getPlatform();
		panels.open("html-viewer");
	} else {
		document.getElementById("html-iframe").src = "about:blank";
	}
}