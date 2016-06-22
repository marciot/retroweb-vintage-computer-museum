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

/* Interface to RetroWeb Browser */

var ifce = createDefaultEmulatorInterface();

ifce.setArgument("trs80l2", "");
ifce.setArgument("-verbose", "");
ifce.setArgument("-rompath", ".");
ifce.setArgument("-flop1", "fd1.DSK");
ifce.setArgument("-window", "");
ifce.setArgument("-resolution", "1024x768");
ifce.setArgument("-nokeepaspect", "");
ifce.setArgument("-autoframeskip", "");
ifce.setArgument("-nosound", "");
ifce.setArgument("-uimodekey", "ESC");

ifce.createModule = function(module) {
	EmulatorInterface.prototype.configModule.call(this, module); /* Call the superclass */
	
	module.SDL_numSimultaneouslyQueuedBuffers = 5;
	module.screenIsReadOnly = true;
	module.canvas.width  = 1024;
	module.canvas.height = 768;
}

ifce.getDrives = function() {
	return {
		"hd1" : null,
		"fd1" : "fd1.DSK"
	}
}

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
