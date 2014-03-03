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

function emulatorPreRun() {
	Module.arguments = ["-c", "roms/pce-config.cfg", "-g", "cga", "-r"];
}

// Loads a disk that has been copied to the emscripten local store
function emulatorMountDisk(disk) {
	console.log("Mounting " + disk);
	pcSetMessage ("emu.disk.insert", "0:" + disk);
}

function emulatorReset() {
	if(waitingForRoms) return;
	if(shouldRunNow == false) {
		shouldRunNow = true;
		run();
	} else {
		pcSetMessage ("emu.reset", "");
	}
}

function pcSetMessage(msg,val) {
	var sim = _pc_get_sim();
	var _pcSetMessage = Module.cwrap('pc_set_msg', 'int', ['int','string', 'string']);
	_pcSetMessage(sim, msg, val);
}