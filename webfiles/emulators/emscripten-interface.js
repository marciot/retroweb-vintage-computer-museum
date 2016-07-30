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

var Module;

class EmscriptenEmulatorInterface extends EmulatorInterface {
	constructor() {
		super();
	}

	loadScriptsAndStart(stateObj) {
		var me = this;
		Module = {
			preRun:  [function () {stateObj.transitionToRunning(); me.preRun();}],
			postRun: [],
			preInit: [function () {emulator.syncFileSystem(false); emulator.dispatchEvent("emscriptenPreInit");}],
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
			monitorRunDependencies: function(left) {},
			keyboardListeningElement: document.getElementById('screen')
		};
		// Give the emulator subclasses a chance to modify the Emscripten module
		this.configModule(Module);
		super.loadScriptsAndStart(stateObj);
	}

	setSerialDataAvailableCallback(callback) {
		if(!this.serialDevice) {
			this.serialDevice = new EmscriptenSerialDevice();
		}
		this.serialDevice.setSerialDataAvailableCallback(callback);
	}

	sendSerialDataToEmulator(data) {
		this.serialDevice.sendSerialDataToEmulator(data);
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
}

/* In order to get data in and out of the emulator, we create a virtual character device
 * in the Emscripten filesystem. We then have the PCE emulator use the posix character
 * driver to read and write to that file.
 */
class EmscriptenSerialDevice {
	constructor() {
		this.availableData = "";
		var me = this;
		emulator.addEventListener("emscriptenPreInit", function() {
			me.createFile("ser_a.io");
		});
	}

	sendSerialDataToEmulator(data) {
		this.availableData += data;
	}

	createFile(file) {
		var me = this;
		function serialWrite(stream, buffer, offset, length, position) {
			for(var i = 0; i < length; i++) {
				var data = buffer[offset+i];
				me.characterAvailableCallback(String.fromCharCode(data));
			}
			return length;
		}

		function serialRead(stream, buffer, offset, length, position) {
			if(me.availableData.length) {
				if(length > me.availableData.length) {
					length = me.availableData.length;
				}
				for(var i = 0; i < length; i++) {
					buffer[offset+i] = me.availableData.charCodeAt(i);
				}
				me.availableData = "";
				return length;
			} else {
				return 0;
			}
		}

		console.log("Created serial device file", file);

		var ops = {
			read:   serialRead,
			write:  serialWrite
		};

		var id = FS.makedev(64, 0);
		FS.registerDevice(id, ops);
		FS.mkdev(file, id);
	}

	setSerialDataAvailableCallback(callback) {
		this.characterAvailableCallback = callback;
	}
}