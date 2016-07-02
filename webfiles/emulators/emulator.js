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

var processEmulatorConfig = null;

class EmulatorState {
	constructor(emulator) {
		this.emulator     = emulator;
		this.emuName      = null;
		this.emuConfig    = null;
		this.emuIfce      = null;
		
		this.gotRoms      = false;
		this.gotBootMedia = false;
		this.downloading  = false;
		this.started      = false;
		this.running      = false; // Emscripten preinit called. Okay to manipulate files
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
		popups.setStatus(text);
	}
	
	// Calls a callback and clears the callback so it won't be called multiple times.
	callCallback(name) {
		var callback = emulatorCallbacks[name];
		emulatorCallbacks[name] = null;
		if(callback) callback();
	}

	/* This method should be called after one of the state variables has been
	 * changed. The primary role for this method is to show/hide the status
	 * dialog boxes. It may also invoke callbacks. In certain contexts, this
	 * is unsafe, so the the caller may set unsafeForCallbacks to true
	 */
	stateChanged(unsafeForCallbacks) {
		/*console.log("State transition:");
		console.log("  gotRoms: ",             this.gotRoms);
		console.log("  gotConfig: ",           this.emuConfig != false);
		console.log("  gotBootMedia: ",        this.gotBootMedia);
		console.log("  downloading: ",         this.downloading);*/
		
		popups.setVisibility("popup-rom-missing",     !this.gotRoms);
		popups.setVisibility("popup-need-boot-media", !this.gotBootMedia);
		popups.setVisibility("popup-status",          this.downloading || (this.started && !this.running));

		if(!unsafeForCallbacks) {
			/* Dispatch callbacks if it is safe to do so */

			if(this.emuConfig) {
				this.callCallback("onEmulatorConfigured");
			}

			if(this.gotRoms && this.emuConfig && this.emuIfce) {
				this.callCallback("onEmulatorLoaded");
			}
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
		this.emulator.preloadResources();
		this.stateChanged();
	}
	
	syncEmscriptenFS(doMount) {
		this.emuIfce.syncEmscriptenFS(doMount);
	}

	emscriptenPostRun() {
	}
	
	emscriptenPreInit() {
		this.syncEmscriptenFS(false);
	}
	
	emscriptenPreRun() {
		emuState.getEmulatorInterface().preRun();
		this.running = true;
		this.stateChanged(true);
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
		if (!this.started) {
			this.emulator.loadScriptsAndStart();
			this.started = true;
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

class Emulator {
	constructor(emulator) {
		this.onEmulatorConfigured  = function() {};
		this.onEmulatorLoaded      = function() {};

		this.state       = emuState    = new EmulatorState(this);
		this.fileManager = fileManager = new EmscriptenFileManager();

		/* Bootstrap the emulator by loading "bootstrap.html". This file will call
		 * the global function processEmulatorConfig. We create this function here
		 * and bind it to this object.
		 */
		function createGlobalCallback(emulator) {
			processEmulatorConfig = function(config) {
				emulator.processConfig(config);
			};
		}
		createGlobalCallback(this);
		this.state.setEmulator(emulator);
		loadResource("/emulators/" + emulator + "/bootstrap.html", true);
	}

	processConfig(config) {
		var dirsToMake = config["mkdir"];
		if(dirsToMake) {
			for (var i = 0; i < dirsToMake.length; ++i) {
				var path = dirsToMake[i];
				this.fileManager.makeDir(path);
			}
		}

		function filePart(path) {
			return path.substr(path.lastIndexOf("/")+1);
		}

		var filesToMount = config["preload-files"];
		for (var i = 0; i < filesToMount.length; ++i) {
			if (filesToMount[i].charAt(0) == '#') continue;
			var parts = filesToMount[i].split(/\s+->\s+/);
			var url = parts[0];
			var name = (parts.length > 1) ? parts[1] : filePart(parts[0]);
			this.fileManager.writeFileFromUrl('/' + name, url);
		}
		this.state.romsLoaded();
		this.state.configLoaded(config);
	}

	preloadResources() {
		console.log("Loading emulator resources");
		var config = this.state.getConfig();
		for(var i = 0; i < config.pre.length; i++) {
			loadResource(config.pre[i], true);
		}
	}

	/* Load the main emulator script(s). This will start the emulator execution. */
	loadScriptsAndStart() {
		console.log("Loading emulator scripts");
		Module = this.state.getEmulatorInterface().createEmscriptenModule(this.state);
		var config = this.state.getConfig();
		for(var i = 0; i < config.run.length; i++) {
			loadResource(config.run[i], true);
		}
	}

	restart() {
		this.state.requestRestart();
	}

	/* The cassette actions allow you to play, record, rewind or append to the tape */

	cassetteAction(action) {
		if(!this.state.isRunning()) {
			alert("The emulator must be running before you use this action.");
			return;
		}
		this.state.getEmulatorInterface().cassetteAction(action);
	}

	/* This function lets you mount a file into the emulator from an URL */
	
	mountDriveFromUrl(drive, url, isBootable) {
		if(isBootable && this.state.isRunning()) {
			alert("This disk will be inserted, but if you want to boot from it you will need to reload the web page to reset the computer.");
			isBootable = false;
		}

		var dstName = this.state.getEmulatorInterface().getFileNameForDrive(drive, url);
		this.fileManager.writeFileFromUrl(dstName, url);
		this.state.waitForMedia(dstName, isBootable);
	}

	/* This function lets you load a file into the emulator from an URL */

	getFileFromUrl(url, file) {
		this.fileManager.writeFileFromUrl(file, url);
		this.state.waitForMedia(file);
	}

	/* The upload actions allow you to upload modified files from your local computer into
	 * the Emscripten FS. When these methods are called, a dialog box will allow the user
	 * to select a file or floppy to upload. */

	uploadFloppy(drive, isBootable) {
		popups.askForFile("Select floppy disk image", function(file) {
			var dstName = this.state.getEmulatorInterface().getFileNameForDrive(drive, file.name);
			this.fileManager.writeFileFromFile(dstName, file);
			this.state.waitForMedia(dstName, isBootable);
		});
	}

	uploadFile(dstName, what, isBootable) {
		popups.askForFile("Please select a " + what, function(file) {
			this.fileManager.writeFileFromFile(dstName, file);
			this.state.waitForMedia(dstName, isBootable);
		});
	}

	/* The download actions allow you to download modified files from the Emscripten FS to
	 * your local computer. */

	downloadFloppy(drive) {
		var fileName = this.state.getEmulatorInterface().getFileNameForDrive(drive, null);
		if(typeof FS == 'undefined') {
			alert("The emulator must be initialized");
			return;
		}
		saveEmscriptenFile(FS, fileName);
	}

	downloadFile(file) {
		if(typeof FS == 'undefined') {
			alert("The emulator must be initialized");
			return;
		}
		saveEmscriptenFile(FS, file);
	}
}








