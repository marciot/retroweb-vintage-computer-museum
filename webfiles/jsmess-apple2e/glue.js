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

/* JSMESS Glue Code (not sure what this does) */
var JSMESS = JSMESS || {};

JSMESS._readySet = false;
JSMESS._readyList = [];
JSMESS._runReadies = function() {
	if (JSMESS._readyList) {
		for (var r=0; r < JSMESS._readyList.length; r++) {
			JSMESS._readyList[r].call(window, []);
		};
		JSMESS._readyList = [];
	};
};
JSMESS._readyCheck = function() {
	if (JSMESS.running) {
		JSMESS._runReadies();
	} else {
		JSMESS._readySet = setTimeout(JSMESS._readyCheck, 10);
	};
};
JSMESS.ready = function(r) {
	if (JSMESS.running) {
		r.call(window, []);
	} else {
		JSMESS._readyList.push(function() { return r.call(window, []); } );
		if (!(JSMESS._readySet)) JSMESS._readyCheck();
	};
};

/* Generic glue code */

function emulatorGetDrives() {
	return {
		"hd1" : null,
		"fd1" : "fd1.DSK"
	}
}

function emulatorConfigModule(module) {
	module.arguments = [
		"apple2ee",
		"-verbose",
		"-rompath",".",
		"-flop1", "fd1.DSK",
		"-window",
		"-resolution","560x192",
		"-nokeepaspect",
		"-autoframeskip",
		"-nosound"
	];
	module.SDL_numSimultaneouslyQueuedBuffers = 5;
	module.screenIsReadOnly = true;
	module.canvas.width  = 280;
	module.canvas.height = 192;
}

function emulatorPreInit() {
}

function emulatorPreRun() {
}

function emulatorMountDisk(disk) {
	alert( "Disk insertion is not available for this emulator. To try another disk, reload the page to reset the emulator." );
}

function emulatorReset() {
	alert( "This functionality is not available for this emulator. Refresh the page to restart the emulator." );
}

