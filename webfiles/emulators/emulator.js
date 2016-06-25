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

class EmulatorState {
	constructor() {
		this.emuName      = null;
		this.emuConfig    = null;
		this.emuIfce      = null;
		
		this.loaded       = false;
		this.running      = false;
		this.gotRoms      = false;
		this.gotBootMedia = false;
		this.downloading  = false;
		this.floppyDrives = new Array();
	}
	
	setEmulator(emulator) {
		this.emuName = emulator;
	}

	getEmulator() {
		return this.emuName;
	}
	
	setEmulatorInterface(ifce) {
		this.emuIfce = ifce;
		this.stateChanged();
	}
	
	getEmulatorInterface() {
		return this.emuIfce;
	}
	
	getConfig(emulator) {
		return this.emuConfig;
	}

	setStatus(text) {
		document.getElementById("status-text").innerHTML = text;
	}
	
	stateChanged() {
		console.log("State transition:");
		console.log("  gotRoms: ",             this.gotRoms);
		console.log("  gotConfig: ",           this.emuConfig != false);
		console.log("  gotBootMedia: ",        this.gotBootMedia);
		console.log("  downloading: ",         this.downloading);
		
		popups.toggle("popup-rom-missing",     !this.gotRoms);
		popups.toggle("popup-need-boot-media", !this.gotBootMedia);
		popups.toggle("popup-status",          this.downloading);
		popups.apply();
		
		if(this.gotRoms && this.emuConfig && this.emuIfce) {
			var callback = emulatorCallbacks.onEmulatorLoaded;
			emulatorCallbacks.onEmulatorLoaded = null;
			if(callback) callback();
		}
	}
	
	waitForMedia(fileName, isBootable) {
		this.setStatus("Downloading...");
		this.downloading = true;
		this.stateChanged();
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
				me.downloading = false;
				me.stateChanged();
			}
		}
		fileManager.setFileReadyCallback(waitFunc);
	}
	
	configLoaded(config) {
		this.emuConfig = config;
		loadEmulatorResources();
		this.stateChanged();
	}
	
	syncEmscriptenFS(doMount) {
		var filesWritten = fileManager.syncEmscriptenFS();
		console.log("Preparing disks...");
		for(var i = 0; i < filesWritten.length; i++) {
			emuState.getEmulatorInterface().prepareDisk(filesWritten[i]);
			if(doMount) {
				emuState.getEmulatorInterface().mountDisk(filesWritten[i]);
			}
		}
	}
	
	emscriptenPreInit() {
		this.syncEmscriptenFS(false);
	}
	
	emscriptenPreRun() {
		emuState.getEmulatorInterface().preRun();
		this.running = true;
	}
	
	emscriptenDependencies(remaining) {
		/*alert("Emscripten dependencies");
		if(remaining > 0) {
			popups.open("popup-status");
		} else {
			popups.close("popup-status");
		}*/
	}
	
	emscriptenStatus(status) {
	}
	
	romsLoaded() {
		this.gotRoms = true;
		this.stateChanged();
	}
	
	bootMediaLoaded() {
		this.gotBootMedia = true;
		this.stateChanged();
	}
	
	requestRestart() {
		if (!this.gotRoms || !this.gotBootMedia) {
			return;
		}
		if (!this.loaded) {
			loadEmulator();
			this.loaded = true;
			this.stateChanged();
			this.setStatus("Starting emulator...");
		} else if(this.running) {
			emuState.getEmulatorInterface().reset();
		}
	}
	
	isRunning() {
		return this.running;
	}
	
	floppyMounted(fname) {
		if( !(fname in this.floppyDrives)) {
			this.floppyDrives[fname] = {};
		}
		this.floppyDrives[fname].mounted = true;
	}
	
	isFloppyMounted(fname) {
		return this.floppyDrives.hasOwnProperty(fname) ? this.floppyDrives[fname].mounted : false;
	}
}

function createEmscriptenModule() {
	var module = {
		preRun: [function () {emuState.emscriptenPreRun();}],
		postRun: [emulatorCallbacks.onEmulatorRunning],
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
		setStatus: function(status) {emuState.emscriptenStatus(status);},
		totalDependencies: 0,
		monitorRunDependencies: function(left) {emuState.emscriptenDependencies(left);}
	};
	// Give the emulator a chance to modify the Emscripten module
	emuState.getEmulatorInterface().configModule(module);
	return module;
}

function processEmulatorConfig(emulatorConfig) {
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
	emuState.configLoaded(emulatorConfig);
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
	Module = createEmscriptenModule();
	var config = emuState.getConfig();
	for(var i = 0; i < config.run.length; i++) {
		loadResource(config.run[i], true);
	}
}

function restartComputer() {
	emuState.requestRestart();
}

/* File management - Most of the heavy-lifting is done by the EmscriptenFileManager object */

function mountDriveFromUrl(drive, url, isBootable) {
	if(isBootable && emuState.isRunning()) {
		alert("This disk will be inserted, but if you want to boot from it you will need to reload the web page to reset the computer.");
		isBootable = false;
	}

	var dstName = emuState.getEmulatorInterface().getFileNameForDrive(drive, url);
	fileManager.writeFileFromUrl(dstName, url);
	emuState.waitForMedia(dstName, isBootable);
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