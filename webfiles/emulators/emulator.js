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
		this.drives       = new Array();
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

	driveMounted(drive) {
		if( !(drive in this.drives)) {
			this.drives[drive] = {};
		}
		this.drives[drive].mounted = true;
	}

	isDriveMounted(drive) {
		return this.drives.hasOwnProperty(drive) ? this.drives[drive].mounted : false;
	}
}

class Emulator {
	constructor(emulator, opts) {
		this._name			= emulator;
		this._state			= new EmulatorState(this, opts.popups);
		this.fileManager	= new EmulatorFileSystem();
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
				if(me.deferredSerialCallback) {
					me.setSerialDataAvailableCallback(me.deferredSerialCallback);
				}
			};
		}
		createGlobalCallback(this);
		loadResource("/emulators/" + emulator + "/bootstrap.html", true);
	}

	setSerialDataAvailableCallback(callback) {
		if(this.emuIfce) {
			this.emuIfce.setSerialDataAvailableCallback(callback);
		} else {
			this.deferredSerialCallback = callback;
		}
	}

	sendSerialDataToEmulator(data) {
		this.getEmulatorInterface().sendSerialDataToEmulator(data);
	}

	setEmulatorInterface(ifce) {
		this.emuIfce = ifce;
		this._state.transitionToInterfaceLoaded();
	}

	getEmulatorInterface() {
		return this.emuIfce;
	}

	_fileWrittenFunction(name, meta) {
		if(meta && "drive" in meta) {
			this.getEmulatorInterface().prepareDisk(name);
			if(this.state.isRunning) {
				this.getEmulatorInterface().mountDisk(name);
			}
			emulator.state.driveMounted(meta.drive);
		}
	}

	syncFileSystem() {
		if(this._state.isStarted) {
			this.fileManager.syncFileSystem(this._fileWrittenFunction.bind(this));
		}
	}

	_diskReadyFunc(remaining, depName) {
		if(depName == this.expectedBootDisk) {
			this.state.transitionToBootMediaLoaded();
		}
		if(remaining == 0) {
			if(this.state.isRunning) {
				this.syncFileSystem();
			} else if(this.state.hasBootMedia) {
				this.restart();
			}
			this.state.transitionToDownloading(false);
		}
	}

	expectMedia(fileName, isBootable) {
		if(isBootable) {
			this.expectedBootDisk = fileName;
		}
		this._state.transitionToDownloading(true);
		this.fileManager.setFileReadyCallback(this._diskReadyFunc.bind(this));
	}

	restart() {
		if (!this._state.isReadyToStart) {
			return;
		}
		if (!this._state.isStarted) {
			/* Load the main emulator script(s). This will start the emulator execution. */
			this.syncFileSystem();
			this.getEmulatorInterface().loadScriptsAndStart(this._state);
			this._state.transitionToStarted();
		} else if(this._state.isRunning) {
			this.getEmulatorInterface().reset();
		}
	}

	bootFromRom(opts) {
		this.processOptionalEmuArgs(opts);
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

	/* This is a separate function since it is used by both mountDriveFromUrl and bootFromRom */
	processOptionalEmuArgs(opts) {
		if(opts && "emulator-args" in opts) {
			var args = opts["emulator-args"];
			for(var arg in args) {
				this.getEmulatorInterface().setArgument(arg, args[arg]);
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
			/* Add command line switches in opts.emulator-args prior to starting emulator */
			this.processOptionalEmuArgs(opts);
			/* If a "boot-hd" or "boot-fd" is present, it causes a separate boot disk to be
			   used along with this disk */
			if("boot-hd" in opts) {
				if(drive == "hd1") {
					drive = "hd2";
				}
				this.mountDriveFromUrl("hd1", opts["boot-hd"], true);
				isBootable = false;
			}
			if("boot-fd" in opts) {
				if(drive == "fd1") {
					drive = "fd2";
				}
				this.mountDriveFromUrl("fd1", opts["boot-fd"], true);
				isBootable = false;
			}
			/* Override the drive id if opts.drive exists */
			if("drive" in opts) {
				drive = opts.drive;
			}
		}

		var dstName = this.getEmulatorInterface().getFileNameForDrive(drive, url);
		this.expectMedia(dstName, isBootable);
		this.fileManager.writeFileFromUrl(dstName, url, {"drive": drive});
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
		var me = this;
		this.popups.askForFile("Select floppy disk image", function(file) {
			var dstName = me.getEmulatorInterface().getFileNameForDrive(drive, file.name);
			me.expectMedia(dstName, isBootable);
			me.fileManager.writeFileFromFile(dstName, file, {"drive": drive});
		});
	}

	uploadFile(dstName, what, isBootable) {
		var me = this;
		this.popups.askForFile("Please select a " + what, function(file) {
			me.expectMedia(dstName, isBootable);
			me.fileManager.writeFileFromFile(dstName, file);
		});
	}

	/* The download actions allow you to download modified files to your local computer. */

	downloadFloppy(drive) {
		this.getEmulatorInterface().flushDiskFiles();
		var fileName = this.getEmulatorInterface().getFileNameForDrive(drive, null);
		this.fileManager.saveFileToLocal(fileName);
	}

	downloadFile(file) {
		this.getEmulatorInterface().flushDiskFiles();
		this.fileManager.saveFileToLocal(file);
	}

	get name() {
		return this._name;
	}

	get state() {
		return this._state;
	}

	get byline() {
		return this.getEmulatorInterface().byline;
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

/* This object enqueues Emscripten file system operations to allow
 * resources to be loaded from various sources asynchronously. This
 * object allows the calling code to prepare resources even before
 * initializing Emscripten.
 *
 * The calling code should use the EmulatorFileSystem as follows:
 *
 *   1 - Create an EmulatorFileSystem object
 *   2 - Register a fileReady callback with setFileReadyCallback
 *   3 - Call one of more routines to enqueue file system operations:
 *         - makeDir
 *         - writeFileFromBinaryData
 *         - writeFileFromUrl
 *         - writeFileFromFile
 *         - waitForCallback (block until user action)
 *   4 - When the fileReady callback indicates all resources are ready,
 *       the emulator code can be launched.
 *   5 - From the preInit callback, call syncFileSystem to playback
 *       file system operations into the actual Emscripten FS.
 */
class EmulatorFileSystem {
	constructor() {
		this.dirs  = new Array();
		this.files = new Array();
		this.remainingFiles = 0;
		this.print = function(text) {console.log(text)};
	}

	setPrintCallback(callback) {
		this.print = callback;
	}

	/* Registers a callback that will be called each time
	 * a file is successfully retrieved from an asynchronous
	 * source (an URL or an interactive selection) and is ready
	 * to be written to the Emscripten FS. The callback
	 * will receive two argument, the number of files
	 * remaining to retrieve, and the file which is now ready.
	 *
	 * Note: This callback does not indicate that the files were
	 * written to the Emscripten FS, it merely indicates that they
	 * are ready to be written using syncEmscriptenFS. A value
	 * of zero indicates that it is a good time to launch
	 * the emulator and call "syncEmscriptenFS" from preInit.
	 */
	setFileReadyCallback(callback) {
		this.fileReadyCallback = callback;
	}

	/* The following function performs enqueued file operations
	 * on an Emscripten FS object. It should be called during
	 * or after Emscripten's preInit phase.
	 *
	 * Option: fileWrittenFunc if provided, will be called for
	 * each file that is written
	 */
	syncFileSystem(fileWrittenFunc) {
		// Create subdirectories
		for (var i = 0; i < this.dirs.length; ++i) {
			var d = this.dirs[i];
			if(!d.written) {
				if(typeof FS != 'undefined') {
					this.print("Creating directory /" + d.path + " in the Emscripten FS");
					FS.mkdir (d.path);
				}
				d.written = true;
			}
		}

		// Write files
		for (var i = 0; i < this.files.length; ++i) {
			var f = this.files[i];
			if(!f.written) {
				if(typeof FS != 'undefined') {
					this.print("Writing file " + f.name + " to the Emscripten FS");
					var stream = FS.open(f.name, 'w');
					FS.write(stream, f.data, 0, f.data.length, 0);
					FS.close(stream);
				}
				f.written = true;
				if(fileWrittenFunc) {
					fileWrittenFunc(f.name, f.meta);
				}
			}
		}
	}

	_fileRef(fileName) {
		for(var i = 0; i < this.files.length; i++) {
			if(this.files[i].name == fileName) {
				return this.files[i];
			}
		}
		var newRef = {
			"name" : fileName,
			"data" : null,
			"written" : false
		};
		this.files.push(newRef);
		return newRef;
	}

	_incrementCounter() {
		this.remainingFiles++;
	}

	_decrementCounter(depName) {
		this.remainingFiles--;
		if(typeof this.fileReadyCallback == 'function') {
			this.fileReadyCallback(this.remainingFiles, depName);
		}
	}

	/* The following functions enqueue operations for playback using
	   syncEmscriptenFS. The reason for this is that it is often
	   useful to begin populating the file system before Emscripten
	   is actually started.
	 */

	makeDir(dirPath) {
		this.dirs.push({"path" : dirPath, "written" : false});
	}

	/* Prepares to write binary data the Emscripten FS
	 *
	 *   dstFileName : Name used to write file to the Emscripten FS
	 *   srcUrl :      URL for the resource
	 *   meta:         Optional metadata to associate with file
	 */
	writeFileFromBinaryData(dstFileName, srcData, meta) {
		var ref     = this._fileRef(dstFileName);
		ref.data    = new Uint8Array(srcData);
		ref.meta    = meta;
		ref.written = false;
	}

	/* Causes a file to be retrieved via HTTP from a URL and prepares
	 * it to be written to the Emscripten FS
	 *
	 *   dstFileName : Name used to write file to the Emscripten FS
	 *   srcUrl :      URL for the resource
	 *   meta:         Optional meta data for the file
	 */
	writeFileFromUrl(dstFileName, srcUrl, meta) {
		this._incrementCounter();
		var me = this;
		var xhr = new XMLHttpRequest();
		xhr.open("GET", srcUrl, true);
		xhr.responseType = "arraybuffer";
		xhr.onreadystatechange = function(e) {
			if (xhr.readyState == 4) {
				switch(xhr.status) {
					case 200: // OK
						me.print("Downloading " + srcUrl);
						me.writeFileFromBinaryData(dstFileName, xhr.response, meta);
						me._decrementCounter(dstFileName);
						break;
					case 404:
						me.print("Downloading " + srcUrl + "... Failed, file not found");
						break;
					default:
						me.print("Downloading " + srcUrl + "... Failed, status:" + status);
						break;
				}
			}
		};
		xhr.send();
	}

	/* Copies data from a File object and prepares it to be written
	 * to the Emscripten FS
	 *
	 *   dstFileName : Name used to write file to the Emscripten FS
	 *   srcFile :     Exiting file object
	 *   meta:         Optional meta data for the file
	 */
	writeFileFromFile(dstName, srcFile, meta) {
		var me = this;
		this._incrementCounter();
		var reader = new FileReader();
		reader.onload = function(evt) {
			if(evt.target.readyState != 2) return;
			if(evt.target.error) {
				me.print('Error while reading file');
				return;
			}
			var name = dstName || srcFile.name;
			me.writeFileFromBinaryData(name, evt.target.result, meta);
			me._decrementCounter(name);
		}
		reader.readAsArrayBuffer(srcFile);
	};

	/* Wraps a callback in such a way that the callback is treated
	 * as a dependency.
	 */

	waitForCallback(callback, depName) {
		var me = this;
		this._incrementCounter();
		return function(arg1, arg2, arg3) {
			callback(arg1, arg2, arg3);
			me._decrementCounter(depName);
		}
	}

	getFileBinaryData(fileName) {
		var ref = this._fileRef(fileName);
		return ref.data;
	}

	/* Shows a dialog box allowing the user to save a file to their hard disk
	 */
	static saveFile(content, filename, contentType)
	{
		if(!contentType) {
			contentType = 'application/octet-stream';
		}
		var blob = new Blob([content], {'type':contentType});
		var a = document.createElement('a');
		a.href = window.URL.createObjectURL(blob);
		a.download = filename;
		a.click();
	}

	/* Shows a dialog box allowing the user to write a file from the Emscripten
	 * file system to their hard disk
	 */
	saveFileToLocal(srcFileName) {
		if(typeof FS == 'undefined') {
			alert("The emulator must be initialized");
			return;
		}
		var contents = FS.readFile(srcFileName, { encoding: 'binary' });
		EmulatorFileSystem.saveFile(contents, srcFileName);
	}
}


