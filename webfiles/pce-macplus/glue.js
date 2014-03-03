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
	Module.arguments = ["-c", "roms/pce-config.cfg", "-r"];
}

// Loads a disk that has been copied to the emscripten local store
function emulatorMountDisk(disk) {
	console.log("Mounting " + disk);
	fixVMacDisks(disk);
	macSetMessage ("emu.disk.insert", "2:" + disk);
	macSetMessage ("mac.insert", "2");
}

function emulatorReset() {
	if(waitingForRoms) return;
	if(shouldRunNow == false) {
		shouldRunNow = true;
		run();
	} else {
		macSetMessage ("emu.reset", "");
	}
}

function macSetMessage(msg,val) {
	var sim = _mac_get_sim();
	var _macSetMessage = Module.cwrap('mac_set_msg', 'int', ['int','string', 'string']);
	_macSetMessage(sim, msg, val);
}

/* VMac disks are DiskCopy 4.2 images that have been stripped of their
 * headers. PCE does not know how to deal with these types of images,
 * so the following will rewrite the headers to make them work.
 */
function fixVMacDisks(disk) {
	
	var stat = FS.stat(disk);
	if (!stat) {
		return;
	}
	
	var disk_size = stat.size;
	var disk_size_byte_1;
	var disk_size_byte_2;
	var disk_encoding;
	var disk_format;
	
	switch(disk_size) {
		case 400 * 1024:
			disk_size_byte_1 = 0x06;
			disk_size_byte_2 = 0x40;
			disk_encoding    = 0x00; /* Set encoding to GCR CLV ssdd (400k) */
			disk_format      = 0x02; /* Set format to Mac 400k */
			console.log("This disk is a Macintosh 400K disk");
			break;
		case 800 * 1024:
			disk_size_byte_1 = 0x0c;
			disk_size_byte_2 = 0x80;
			disk_encoding    = 0x01; /* Set encoding to GCR CLV dsdd (800k) */
			disk_format      = 0x22; /* Set format to Mac 800k */
			break;
		default:
			// Not a vMac disk that we need to worry about
			return;
	}

	/* Fill out all the fields in the DC42 header except for the checksum,
	 * as PCE was modified to issue a warning rather than error out
	 */
	 
	var header = new Uint8Array(84);
	for(var i = 0; i < 84; i++) {
		header[i]=0x00;
	}
	header[0x40] = 0x00;             /* size[0] */
	header[0x41] = disk_size_byte_1; /* size[1] */
	header[0x42] = disk_size_byte_2; /* size[2] */
	header[0x43] = 0x00;             /* size[3] */
	header[0x50] = disk_encoding;
	header[0x51] = disk_format;
	header[0x52] = 0x01; /* Magic byte */
	header[0x53] = 0x00; /* Magic byte */
	
	console.log("Re-writing vMac disk with DC42 header");
	
	var data = FS.readFile(disk, {encoding: 'binary'});
	var stream = FS.open(disk, 'w');
	FS.write(stream, header, 0, header.length);
	FS.write(stream, data,   0, data.length);
	FS.close(stream);
}