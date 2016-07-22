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
			monitorRunDependencies: function(left) {}
		};
		// Give the emulator subclasses a chance to modify the Emscripten module
		this.configModule(Module);
		this.loadScripts();
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
			if(doMount) {
				this.prepareDisk(filesWritten[i]);
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