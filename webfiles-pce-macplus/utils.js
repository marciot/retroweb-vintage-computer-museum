/*
RetroWeb Browser (pce/mac-plus)
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

function loadConfig(json) {
	var startupConfig = json["startup-config"];
	if (
		typeof startupConfig == 'undefined' ||
		typeof startupConfig.version == 'undefined' ||
		typeof startupConfig.platform == 'undefined'
	) {
		throw new LoadException ("Index fails startup-config JSON format validation");
	}
	if (startupConfig.platform != "pce-macplus") {
		throw new LoadException ("The platform of this index does not match this emulator");
	}
	
	var dirsToMake = startupConfig["mkdir"];
	for (var i = 0; i < dirsToMake.length; ++i) {
		var path = dirsToMake[i];
		FS.mkdir (path);
		console.log("Creating directory " + path);
	}
		
	var filesToMount = startupConfig["mount-files"];
	for (var i = 0; i < filesToMount.length; ++i) {
		var parent = filesToMount[i][0];
		if (parent == "_disabled") continue;
		var name   = filesToMount[i][1];
		var url    = filesToMount[i][2];
		FS.createPreloadedFile (parent, name, url, 1, 1, null, function() {alert("Failed to load " + url);});
		console.log("Preloading " + url + " on " + parent + name);
	}
	waitingForRoms = startupConfig["ask-for-rom"];
	if (waitingForRoms) {
		 popups.open("popup-rom-missing");
		 addRunDependency();
	} else {
		popups.open("popup-ready-to-use");
	}
	removeRunDependency();
}

function macPreInit() {
	addRunDependency();
	fetchDataFromUrl("startup.json",
		function(content) {
			loadConfig(JSON.parse(content))
		}
	);
}

function macPreRun() {
}

function macSetMessage(msg,val) {
	var sim = _mac_get_sim();
	var _macSetMessage = Module.cwrap('mac_set_msg', 'int', ['int','string', 'string']);
	_macSetMessage(sim, msg, val);
}

// Loads a disk that has been copied to the emscripten local store
function macMountDisk(disk) {
	macSetMessage ("emu.disk.insert", "2:" + disk);
	macSetMessage ("mac.insert", "2");
}

function macMountUrl(url) {
	console.log("Mounting " + url + " on fd2.disk");
	showMacStatus("Downloading...");
	var onLoad = function () {
		macMountDisk("fd2.disk");
		showMacStatus(false);
	};
	var onErr = function () {
		showMacStatus(false);
		alert("Failed to load disk. Bummer!");
	};
	try {
		FS.unlink("/fd2.disk");
	} catch (err) {
	}
	FS.createPreloadedFile('/', "fd2.disk", url, 1, 1, onLoad, onErr);
}

function macReset() {
	if(waitingForRoms) return;
	if(shouldRunNow == false) {
		shouldRunNow = true;
		run();
	} else {
		macSetMessage ("emu.reset", "");
	}
}

function showMacStatus(text) {
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
			showMacStatus(false);
            alert('Error while reading file');
            return;
        }

        var filecontent =  new Uint8Array(evt.target.result);
		FS.writeFile(path, filecontent, { encoding: 'binary' });
		callback();
		showMacStatus(false);
    };
	showMacStatus("Loading...");
    reader.readAsArrayBuffer(file);
}

function doFloppyUpload (file) {
	if(!file) return;
	popups.close("popup-uploader");
	doLocalUpload(file, "/fd1.data", function() {macMountDisk("fd1.data");});
}

function doRomUpload (file) {
	if(!file) return;
	popups.close("popup-uploader");
	doLocalUpload(file, "/roms/mac-plus-3.rom", function() {
		if (waitingForRoms) {
			waitingForRoms = false;
			removeRunDependency();
		}
		popups.close("popup-rom-missing");
		popups.open("popup-ready-to-use");
	});
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

function htmlViewerCloseAction() {
	showHtmlViewer(false);
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function showHtmlViewer(url) {
	if(url) {
		document.getElementById("navigator").style.height = "15%";
		document.getElementById("html-viewer").style.height = "70%";
		toggleElementDisplay("html-viewer", true);
		toggleElementDisplay("html-viewer-button", true);
		
		if(endsWith(url, '.txt')) {
			div = document.getElementById("html-text-viewer"); 
			div.innerHTML = '\n\n\n\n';
			toggleElementDisplay("html-iframe", false);
			toggleElementDisplay("html-text-viewer", true);
			fetchDataFromUrl(url, function(content) {div.innerHTML += content + '\n\n\n\n';});
		} else {
			document.getElementById("html-iframe").src = url;
			toggleElementDisplay("html-iframe", true);
			toggleElementDisplay("html-text-viewer", false);
		}
	} else {
		document.getElementById("html-iframe").src = "about:blank";
		document.getElementById("navigator").style.height = "100%";
		document.getElementById("html-viewer").style.height = "100%";
		toggleElementDisplay("html-viewer", false);
		toggleElementDisplay("html-viewer-button", false);
	}
}