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

var registerEmulatorInterface = null;

class EmulatorState {
	constructor(emulator, popups) {
		this.emulator     = emulator;
		this.popups       = popups;

		this.gotIfce      = false;
		this.gotRoms      = false;
		this.gotBootMedia = false;
		this.downloading  = false;
		this.started      = false;
		this.running      = false; // Emscripten preinit called. Okay to manipulate files
		this.floppyDrives = new Array();
	}

	setStatus(text) {
		this.popups.setStatus(text);
	}

	/* This method should be called after one of the state variables has been
	 * changed. The primary role for this method is to show/hide the status
	 * dialog boxes. It may also invoke callbacks. In certain contexts, this
	 * is unsafe, so the the caller may set unsafeForCallbacks to true
	 */
	stateChanged(unsafeForCallbacks) {
		/*console.log("State transition:");
		console.log("  gotRoms: ",             this.gotRoms);
		console.log("  gotBootMedia: ",        this.gotBootMedia);
		console.log("  downloading: ",         this.downloading);*/
		
		this.popups.setVisibility("popup-rom-missing",     !this.gotRoms);
		this.popups.setVisibility("popup-need-boot-media", !this.gotBootMedia);
		this.popups.setVisibility("popup-status",          this.downloading || (this.started && !this.running));

		if(!unsafeForCallbacks) {
			/* Dispatch callbacks if it is safe to do so */

			if(this.gotIfce) {
				this.emulator.dispatchEvent("emulatorLoaded");
			}

			if(this.gotRoms && this.gotIfce) {
				this.emulator.dispatchEvent("emulatorReady");
			}
		}
	}

	transitionToRomsLoaded() {
		this.gotRoms = true;
		this.stateChanged();
	}

	transitionToBootMediaLoaded() {
		this.gotBootMedia = true;
		this.stateChanged();
	}

	transitionToStarted() {
		this.started = true;
		this.stateChanged();
		this.setStatus("Starting emulator...");
	}

	transitionToRunning() {
		this.running = true;
		this.stateChanged(true);
	}

	transitionToInterfaceLoaded() {
		this.gotIfce = true;
		this.stateChanged();
	}

	transitionToDownloading(state) {
		if(state) {
			this.setStatus("Downloading...");
			this.downloading = true;
			this.stateChanged();
		} else {
			this.downloading = false;
			this.stateChanged();
		}
	}

	get isReadyToStart() {
		return this.gotRoms && this.gotBootMedia;
	}

	get isStarted() {
		return this.started;
	}

	get isRunning() {
		return this.running;
	}

	get hasBootMedia() {
		return this.gotBootMedia;
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
	constructor(emulator, opts) {
		this._name			= emulator;
		this._state			= new EmulatorState(this, opts.popups);
		this.fileManager	= new EmscriptenFileManager();
		this.emuIfce		= null;
		this.popups			= opts.popups;
		this.listeners 		= {
			emulatorLoaded:			[],
			emulatorReady:			[],
			emscriptenPreInit:		[]
		}

		/* Bootstrap the emulator by loading "bootstrap.html". This file will call
		 * the global function registerEmulatorInterface. We create this function here
		 * and bind it to this object.
		 */
		var me = this;
		function createGlobalCallback(emulator) {
			registerEmulatorInterface = function(ifce) {
				me.setEmulatorInterface(ifce);
				me.getEmulatorInterface().preloadResources();
				me._state.transitionToRomsLoaded();
			};
		}
		createGlobalCallback(this);
		loadResource("/emulators/" + emulator + "/bootstrap.html", true);
	}

	setEmulatorInterface(ifce) {
		this.emuIfce = ifce;
		this._state.transitionToInterfaceLoaded();
	}

	getEmulatorInterface() {
		return this.emuIfce;
	}

	expectMedia(fileName, isBootable) {
		this._state.transitionToDownloading(true);
		var me = this;
		var waitFunc = function(remaining, depName) {
			if(isBootable && depName == fileName) {
				me.state.transitionToBootMediaLoaded();
			}
			if(remaining == 0) {
				if(me.state.isRunning) {
					me.getEmulatorInterface().syncFileSystem(true);
				} else if(me.state.hasBootMedia) {
					me.restart();
				}
				me.state.transitionToDownloading(false);
			}
		}
		this.fileManager.setFileReadyCallback(waitFunc);
	}

	restart() {
		if (!this._state.isReadyToStart) {
			return;
		}
		if (!this._state.isStarted) {
			/* Load the main emulator script(s). This will start the emulator execution. */
			this.getEmulatorInterface().loadScriptsAndStart(this._state);
			this._state.transitionToStarted();
		} else if(this._state.isRunning) {
			this.getEmulatorInterface().reset();
		}
	}

	bootFromRom(opts) {
		this.processBootOpts(opts);
		if(this._state.isRunning) {
			alert("Cannot change the boot source once the computer is running. Please reload the page to reset");
		} else {
			this._state.transitionToBootMediaLoaded();
			this.restart();
		}
	}

	/* The cassette actions allow you to play, record, rewind or append to the tape */

	cassetteAction(action) {
		if(!this._state.isRunning) {
			alert("The emulator must be running before you use this action.");
			return;
		}
		this.getEmulatorInterface().cassetteAction(action);
	}

	processBootOpts(opts) {
		if(opts && "emulator-args" in opts) {
			if(this._state.isRunning) {
				console.log("WARNING: Ignoring request for command line arguments since computer is already running");
			} else {
				var args = opts["emulator-args"];
				for(var arg in args) {
					this.getEmulatorInterface().setArgument(arg, args[arg]);
				}
			}
		}
	}

	/* This function lets you mount a file into the emulator from an URL */

	mountDriveFromUrl(drive, url, isBootable, opts) {
		if(!this._state.isRunning && !isBootable) {
			alert("Please boot the computer using a boot disk first");
			return;
		}
		if(this._state.isRunning && isBootable) {
			alert("This disk will be inserted, but if you want to boot from it you will need to reload the web page to reset the computer.");
		}

		if(opts) {
			// Override the drive id if opts.drive exists
			drive = ("drive" in opts) ? opts.drive : drive;
			// Add command line switches in opts.emulator-args prior to starting emulator
			this.processBootOpts(opts);
		}

		var dstName = this.getEmulatorInterface().getFileNameForDrive(drive, url);
		this.expectMedia(dstName, isBootable);
		this.fileManager.writeFileFromUrl(dstName, url);
	}

	/* This function lets you load a file into the emulator from an URL */

	getFileFromUrl(url, file) {
		this.expectMedia(file);
		this.fileManager.writeFileFromUrl(file, url);
	}

	/* The upload actions allow you to upload modified files from your local computer into
	 * the Emscripten FS. When these methods are called, a dialog box will allow the user
	 * to select a file or floppy to upload. */

	uploadFloppy(drive, isBootable) {
		this.popups.askForFile("Select floppy disk image", function(file) {
			var dstName = this.getEmulatorInterface().getFileNameForDrive(drive, file.name);
			this.expectMedia(dstName, isBootable);
			this.fileManager.writeFileFromFile(dstName, file);
		});
	}

	uploadFile(dstName, what, isBootable) {
		this.popups.askForFile("Please select a " + what, function(file) {
			this.expectMedia(dstName, isBootable);
			this.fileManager.writeFileFromFile(dstName, file);
		});
	}

	/* The download actions allow you to download modified files to your local computer. */

	downloadFloppy(drive) {
		var fileName = this.getEmulatorInterface().getFileNameForDrive(drive, null);
		saveFileToLocal(fileName);
	}

	downloadFile(file) {
		saveFileToLocal(file);
	}

	get name() {
		return this._name;
	}

	get state() {
		return this._state;
	}

	// Calls a callback and clears the callback so it won't be called multiple times.
	dispatchEvent(event) {
		console.log("dispatchEventListeners called", event);
		if(this.listeners.hasOwnProperty(event)) {
			var callbacks = this.listeners[event];
			for(var i = 0; i < callbacks.length; i++) {
				callbacks[i]();
			}
			// Ensure we are not called multiple times
			delete this.listeners[event];
		}
	}

	addEventListener(event, callback) {
		if(this.listeners.hasOwnProperty(event)) {
			this.listeners[event].push(callback);
		}
	}
}








