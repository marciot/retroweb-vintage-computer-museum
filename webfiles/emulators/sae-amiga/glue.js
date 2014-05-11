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

function insertDisk(data, n) {
	console.log("Got Disk:" + data.byteLength );
	var disk = toBinaryString(data);
	config.floppy.drive[n].type = SAEV_Config_Floppy_Type_35_DD;
	config.floppy.drive[n].name = "floppy";						
	config.floppy.drive[n].data = disk;						
	SAE({
		cmd:'insert',
		unit:n
	});				
}

var ifce = createDefaultEmulatorInterface();

ifce.getDrives = function() {
	return {
		"hd1" : "hd1.img",
		"fd1" : "fd1.disk",
		"fd2" : "fd2.disk"
	}
}

ifce.mountDisk = function(diskFile) {
	console.log("Mounting " + diskFile);
	var data = fileManager.getFileBinaryData(diskFile);
	var driveId = diskFile.match(/fd(\d)+/);
	insertDisk(data, parseInt(driveId[1])-1);
}

ifce.reset = function() {
	pcSetMessage ("emu.reset", "");
}