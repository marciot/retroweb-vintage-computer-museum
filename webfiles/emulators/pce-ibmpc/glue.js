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
ifce.setArgument("-c", "pce-config.cfg");
ifce.setArgument("-g", "cga");
ifce.setArgument("-r", "");

ifce.getDrives = function() {
	return {
		"hd1" : "hd1.img",
		"fd1" : "fd1.disk",
		"fd2" : "fd2.disk"
	}
}

ifce.mountDisk = function(diskFile) {
	console.log("Mounting " + diskFile);
	var driveId = diskFile.match(/fd(\d)+/);
	if(driveId) {
		pcSetMessage ("emu.disk.insert", (driveId[1] - 1) + ":" + diskFile);
	}
}

ifce.reset = function() {
	pcSetMessage ("emu.reset", "");
}

ifce.cassetteAction = function(action) {
	switch(action) {
		case "record":
			pcSetMessage ("emu.tape.save", "end");
			break;
		case "playback":
			pcSetMessage ("emu.tape.load", "0");
			break;
		case "rewind":
			pcSetMessage ("emu.tape.rewind", "");
			break;
		case "append":
			pcSetMessage ("emu.tape.append", "");
			break;
		default:
			alert("Unknown action: " + action);
	}
}

/* Helper functions */

function pcSetMessage(msg,val) {
	var sim = _pc_get_sim();
	var _pcSetMessage = Module.cwrap('pc_set_msg', 'int', ['int','string', 'string']);
	_pcSetMessage(sim, msg, val);
}