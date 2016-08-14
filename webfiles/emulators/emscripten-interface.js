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
			preInit: [function () {emulator.syncFileSystem(); emulator.dispatchEvent("emscriptenPreInit");}],
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
			this.serialDevice = new EmscriptenSerialDevice("ser_a.io");
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
	constructor(filename) {
		this.availableData = "";
		var me = this;
		emulator.addEventListener("emscriptenPreInit", function() {
			me.createFile(filename);
		});
	}

	sendSerialDataToEmulator(data) {
		this.availableData += data;
	}

	/* The following functions are necessary because the values read from the Emscripten device
	 * are signed ints from -128 to 127, which do not behave correctly when converted to characters.
	 * These two functions properly convert the signed quantities into unsigned values from 0 through
	 * 255, which are reversible when passed fromCharCode and charCodeAt.
	 */
	static fromInt8ToCharCode(i) {
		return i & 0xFF;
	}

	static fromCharCodeToInt8(i) {
		return (i << 24) >> 24;
	}

	createFile(file) {
		var me = this;
		function serialWrite(stream, buffer, offset, length, position) {
			for(var i = 0; i < length; i++) {
				var data = EmscriptenSerialDevice.fromInt8ToCharCode(buffer[offset+i]);
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
					buffer[offset+i] = EmscriptenSerialDevice.fromCharCodeToInt8(me.availableData.charCodeAt(i));
				}
				me.availableData = me.availableData.substr(length);
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

function _SDL_CreateRGBSurfaceFrom(pixels, width, height, depth, pitch, rmask, gmask, bmask, amask) {
	// TODO: Actually fill pixel data to created surface.
	// TODO: Take into account depth and pitch parameters.
	// console.log('TODO: Partially unimplemented SDL_CreateRGBSurfaceFrom called!');
	var surface = SDL.makeSurface(width, height, 0, false, 'CreateRGBSurfaceFrom', rmask, gmask, bmask, amask);

	var surfaceData = SDL.surfaces[surface];
	var surfaceImageData = surfaceData.ctx.getImageData(0, 0, width, height);
	var surfacePixelData = surfaceImageData.data;

	// Fill pixel data to created surface.
	// Supports SDL_PIXELFORMAT_RGBA8888 and SDL_PIXELFORMAT_RGB888
	var channels = amask ? 4 : 3; // RGBA8888 or RGB888
	for (var pixelOffset = 0; pixelOffset < width*height; pixelOffset++) {
		surfacePixelData[pixelOffset*4+0] = HEAPU8[pixels + (pixelOffset*channels+0)]; // R
		surfacePixelData[pixelOffset*4+1] = HEAPU8[pixels + (pixelOffset*channels+1)]; // G
		surfacePixelData[pixelOffset*4+2] = HEAPU8[pixels + (pixelOffset*channels+2)]; // B
		surfacePixelData[pixelOffset*4+3] = amask ? HEAPU8[pixels + (pixelOffset*channels+3)] : 0xff; // A
	};

	surfaceData.ctx.putImageData(surfaceImageData, 0, 0);

	return surface;
}