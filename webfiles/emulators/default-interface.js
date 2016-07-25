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

/* Reference:
 *   http://joshgertzen.com/object-oriented-super-class-method-calling-with-javascript/
 */

var Module;

class EmulatorInterface {
	constructor() {
		this.arguments = {};
		this.serialInterface = null;
	}

	enablePointerLock() {
		var element = document.getElementById("screen");
		element.addEventListener('click', function(event){
			element.requestPointerLock = element.requestPointerLock ||
			     element.mozRequestPointerLock ||
			     element.webkitRequestPointerLock;
				// Ask the browser to lock the pointer
				element.requestPointerLock();
		});
	}

	getFileNameForDrive(drive, fileName) {
		if( typeof this.getDrives == "function" ) {
			var fileName = this.getDrives()[drive];
			return fileName;
		} else {
			return drive + ".disk";
		}
	}

	setArgument(arg, value) {
		this.arguments[arg] = value;
		console.log("Setting argument " + arg + " to " + value);
	}

	loadJavascript(filename, async) {
		var fileref = document.createElement('script')
		fileref.setAttribute("type","text/javascript")
		fileref.setAttribute("src", filename)
		if(async == 'async') {
			fileref.setAttribute("async", "async")
		}
		document.getElementsByTagName("head")[0].appendChild(fileref);
	}

	preloadMakeDir(path) {
		emulator.fileManager.makeDir(path);
	}

	preloadFromURL(url, dst) {
		function filePart(path) {
			return path.substr(path.lastIndexOf("/")+1);
		}
		emulator.fileManager.writeFileFromUrl('/' + (dst ? dst : filePart(url)), url);
	}

	loadScriptsAndStart(stateObj) {
		var me = this;
		Module = {
			preRun:  [function () {stateObj.transitionToRunning(); me.preRun();}],
			postRun: [],
			preInit: [function () {me.syncFileSystem(false); emulator.dispatchEvent("emscriptenPreInit");}],
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
			canvas:    document.getElementById('screen'),
			setStatus: function(status) {},
			totalDependencies: 0,
			monitorRunDependencies: function(left) {},
			keyboardListeningElement: document.getElementById('screen')
		};
		// Give the emulator subclasses a chance to modify the Emscripten module
		this.configModule(Module);
		this.loadScripts();
	}

	getSerialDevice(characterAvailableCallback) {
		return new EmscriptenSerialDevice(characterAvailableCallback);
	}

	configModule(module) {
		module.arguments = [];
		for (var arg in this.arguments) {
			module.arguments.push(arg);
			if(this.arguments[arg] != '') {
				module.arguments.push(this.arguments[arg]);
			}
		}
	}

	syncFileSystem(doMount) {
		var filesWritten = emulator.fileManager.syncEmscriptenFS();
		console.log("Preparing disks...");
		for(var i = 0; i < filesWritten.length; i++) {
			this.prepareDisk(filesWritten[i]);
			if(doMount) {
				this.mountDisk(filesWritten[i]);
			}
		}
	}

	preRun() {
	}

	prepareDisk(diskFile) {
	}

	mountDisk(diskFile) {
		alert( "Disk insertion after boot is not available for this emulator. Reload the page to reset the emulator." );
	}

	reset() {
		alert( "This functionality is not available for this emulator. Refresh the page to restart the emulator." );
	}

	cassetteAction(action) {
		alert( "This emulator does not support the cassette interface." );
	}
}

/* In order to get data in and out of the emulator, we create a virtual character device
 * in the Emscripten filesystem. We then have the PCE emulator use the posix character
 * driver to read and write to that file.
 */
class EmscriptenSerialDevice {
	constructor(characterAvailableCallback) {
		this.characterAvailableCallback = characterAvailableCallback;
		this.availableData = "";
		var me = this;
		emulator.addEventListener("emscriptenPreInit", function() {
			me.createFile("ser_a.io");
		});
	}

	sendSerialDataToEmulator(data) {
		this.availableData += data;
	}

	createFile(file) {
		var me = this;
		function serialWrite(stream, buffer, offset, length, position) {
			for(var i = 0; i < length; i++) {
				var data = buffer[offset+i];
				me.characterAvailableCallback(String.fromCharCode(data));
			}
			return length;
		}

		function serialRead(stream, buffer, offset, length, position) {
			if(me.availableData.length) {
				if(length > me.availableData.length) {
					length = me.availableData.length;
				}
				for(var i = 0; i < length; i++) {
					buffer[offset+i] = me.availableData.charCodeAt(i);
				}
				me.availableData = "";
				return length;
			} else {
				return 0;
			}
		}

		console.log("Created serial device file", file);

		var ops = {
			read:   serialRead,
			write:  serialWrite
		};

		var id = FS.makedev(64, 0);
		FS.registerDevice(id, ops);
		FS.mkdev(file, id);
	}
}