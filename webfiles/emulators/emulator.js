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
		return this.startupConfig["initial-doc"];
	}
	
	this.getConfig = function (emulator) {
		return this.startupConfig.emulators[emulator || this.emuName];
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
	
	this.configLoaded = function(config) {
		this.startupConfig = config;
		loadEmulatorResources();
		if(!this.gotRoms) {
			popups.open("popup-rom-missing");
		}
	}
	
	this.syncEmscriptenFS = function(doMount) {
		var filesWritten = fileManager.syncEmscriptenFS();
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
	if(isBootable && emuState.isRunning()) {
		alert("Cannot change the boot media once the computer has already restarted. Please reload the page to reset");
	} else {
		var dstName = emuState.getEmulatorInterface().getFileNameForDrive(drive, url);
		fileManager.writeFileFromUrl(dstName, url, isBootable);
		emuState.waitForMedia(dstName, isBootable);
	}
}

function getFileFromUrl(url, file) {
	fileManager.writeFileFromUrl(file, url);
	emuState.waitForMedia(file);
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

function uploadFile(dstName, what, isBootable) {
	if(!window.FileReader) {
		// Browser is not compatible
		alert("Your web browser does not support this feature");
		return;
	}
	document.getElementById('uploader-text').innerHTML = "Please select a " + what;
	document.getElementById('uploader-ok-btn').onclick = function(evt) {
		popups.close("popup-uploader");
		var file = document.getElementById('uploader-file').files[0];
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

function downloadFile(file) {
	if(typeof FS == 'undefined') {
		alert("The emulator must be initialized");
		return;
	}	
	saveEmscriptenFile(FS, file);
}

function cassetteAction(action) {
	if(!emuState.isRunning()) {
		alert("The emulator must be running before you use this action.");
		return;
	}
	emuState.getEmulatorInterface().cassetteAction(action);
}