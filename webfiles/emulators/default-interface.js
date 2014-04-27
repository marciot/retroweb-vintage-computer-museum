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
 *
 * I am using "Static ( Hard Coded ) Super Calling That Works"
 */

function createDefaultEmulatorInterface() {
	var ifce = new EmulatorInterface();
	emuState.setEmulatorInterface(ifce);
	return ifce;
}

function EmulatorInterface() {
	this.arguments = {};
}

EmulatorInterface.prototype.getFileNameForDrive = function(drive, fileName) {
	if( typeof this.getDrives == "function" ) {
		var fileName = this.getDrives()[drive];
		return fileName;
	} else {
		return drive + ".disk";
	}
}

EmulatorInterface.prototype.setArgument = function(arg, value) {
	this.arguments[arg] = value;
	console.log("Setting argument " + arg + " to " + value);
}

EmulatorInterface.prototype.configModule = function(module) {
	module.arguments = [];
	for (var arg in this.arguments) {
		module.arguments.push(arg);
		if(this.arguments[arg] != '') {
			module.arguments.push(this.arguments[arg]);
		}
	}
}

EmulatorInterface.prototype.preInit = function() {
}

EmulatorInterface.prototype.preRun = function() {
}
	
EmulatorInterface.prototype.prepareDisk = function(disk) {
}

EmulatorInterface.prototype.mountDisk = function(disk) {
	alert( "Disk insertion after boot is not available for this emulator. Reload the page to reset the emulator." );
}

EmulatorInterface.prototype.reset = function() {
	alert( "This functionality is not available for this emulator. Refresh the page to restart the emulator." );
}
	
EmulatorInterface.prototype.bootFromRom = function() {
	if(emuState.isRunning()) {
		alert("Cannot change the boot media once the computer has already restarted. Please reload the page to reset");
	} else {
		emuState.bootMediaLoaded();
	}
}
