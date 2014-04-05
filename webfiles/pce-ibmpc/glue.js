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

function emulatorGetDrives() {
	return {
		"hd1" : "hd1.img",
		"fd1" : "fd1.disk"
	}
}

function emulatorConfigModule(module) {
	module.arguments = [
		"-c", "roms/pce-config.cfg",
		"-r"
	];
}

function emulatorPreRun() {
	Module.arguments = ["-c", "roms/pce-config.cfg", "-g", "cga", "-r"];
}

// Loads a disk that has been copied to the emscripten local store
function emulatorMountDisk(disk) {
	console.log("Mounting " + disk);
	pcSetMessage ("emu.disk.insert", "0:" + disk);
}

// Note: this function should not be called directly. Call
// restartComputer() instead since it properly deals the
// with the case where the computer has not begun running.
function emulatorReset() {
	pcSetMessage ("emu.reset", "");
}

function emulatorBootFromRom() {
	if(emuState.isRunning()) {
		alert("Cannot change the boot media once the computer has already restarted. Please reload the page to reset");
	} else {
		emuState.bootMediaLoaded();
	}
}

function pcSetMessage(msg,val) {
	var sim = _pc_get_sim();
	var _pcSetMessage = Module.cwrap('pc_set_msg', 'int', ['int','string', 'string']);
	_pcSetMessage(sim, msg, val);
}