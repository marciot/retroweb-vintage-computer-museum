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

class EmulatorInterface {
	constructor() {
		this.arguments = {};
	}

	enablePointerLock() {
		var element = document.getElementById("screen");
		var buttons = document.querySelector("emulator-buttons");
		if(buttons) {
			buttons.enablePointerLock(element);
		}
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
		this.loadScripts();
	}

	setSerialDataAvailableCallback(characterAvailableCallback) {
		console.log("setSerialDataAvailableCallback: not implemented for this emulator");
	}

	sendSerialDataToEmulator(data) {
		console.log("sendSerialDataToEmulator: not implemented for this emulator");
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

	flushDiskFiles() {
		console.log("flushDiskFiles: not implemented for this emulator");
	}

	cassetteAction(action) {
		alert( "This emulator does not support the cassette interface." );
	}

	get byline() {
		return "This emulator is missing a byline";
	}
}