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

/* Fetches a file from an URL, then calls the function callback
 * when the file download is complete
 */
function fetchFile(url, callback, onerror) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.responseType = "arraybuffer";
	xhr.onreadystatechange = function(e) {
		if (xhr.readyState == 4) {
			// continue only if HTTP status is "OK"
			if (xhr.status == 200) {
				callback(xhr.response);
			} else {
				onerror(xhr.status);
			}
		}
	};
	xhr.send();
}

/* Shows a dialog box allowing the user to save a file to their hard disk
 */
function saveFile(content, filename, contentType)
{
	if(!contentType) {
		contentType = 'application/octet-stream';
	}
	var blob = new Blob([content], {'type':contentType});
	var a = document.createElement('a');
	a.href = window.URL.createObjectURL(blob);
	a.download = filename;
	a.click();
}

/* Shows a dialog box allowing the user to write a file from the Emscripten
 * file system to their hard disk
 */
function saveEmscriptenFile(emscriptenFS, srcFileName) {
	var contents = emscriptenFS.readFile(srcFileName, { encoding: 'binary' });
	saveFile(contents, srcFileName);
}

/* This object enqueues Emscripten file system operations to allow
 * resources to be loaded from various sources asynchronously. This
 * object allows the calling code to prepare resources even before
 * initializing Emscripten.
 *
 * The calling code should use the EmscriptenFileManager as follows:
 *
 *   1 - Create an EmscriptenFileManager object
 *   2 - Register a fileReady callback with setFileReadyCallback
 *   3 - Call one of more routines to enqueue file system operations:
 *         - makeDir
 *         - writeFileFromBinaryData
 *         - writeFileFromUrl
 *         - writeFileFromFile
 *         - waitForCallback (block until user action)
 *   4 - When the fileReady callback indicates all resources are ready,
 *       the Emscripten code can be launched.
 *   5 - From the preInit callback, call syncEmscriptenFS to playback
 *       file system operations into the actual Emscripten FS.
 */
function EmscriptenFileManager() {
	this.dirs  = new Array();
	this.files = new Array();
	this.remainingFiles = 0;
	this.print = function(text) {console.log(text)};
	
	this.setPrintCallback = function(callback) {
		this.print = callback;
	}
	
	/* Registers a callback that will be called each time
	 * a file is successfully retrieved from an asynchronous
	 * source (an URL or an interactive selection) and is ready
	 * to be written to the Emscripten FS. The callback
	 * will receive two argument, the number of files
	 * remaining to retrieve, and the file which is now ready.
	 *
	 * Note: This callback does not indicate that the files were
	 * written to the Emscripten FS, it merely indicates that they
	 * are ready to be written using syncEmscriptenFS. A value
	 * of zero indicates that it is a good time to launch
	 * the emulator and call "syncEmscriptenFS" from preInit.
	 */
	this.setFileReadyCallback = function(callback) {
		this.fileReadyCallback = callback;
	}
	
	/* The following function performs enqueued file operations
	 * on an Emscripten FS object. It should be called during
	 * or after Emscripten's preInit phase.
	 */
	this.syncEmscriptenFS = function(FS) {
		var filesWritten = [];
		if(typeof FS == 'undefined') {
			this.print("Enscripten FS not defined");
			return;
		}
		// Create subdirectories
		for (var i = 0; i < this.dirs.length; ++i) {
			var d = this.dirs[i];
			if(!d.written) {
				this.print("Creating directory /" + d + " in the Emscripten FS");
				FS.mkdir (d);
				d.written = true;
			}
		}
		
		// Write files
		for (var i = 0; i < this.files.length; ++i) {
			var f = this.files[i];
			if(!f.written) {
				this.print("Writing file " + f.name + " to the Emscripten FS");
				var stream = FS.open(f.name, 'w');
				FS.write(stream, f.data, 0, f.data.length, 0);
				FS.close(stream);
				f.written = true;
				filesWritten.push(f.name);
			}
		}
		
		return filesWritten;
	}
	
	this._fileRef = function(fileName) {
		for(var i = 0; i < this.files.length; i++) {
			if(this.files[i].name == fileName) {
				return this.files[i];
			}
		}
		var newRef = {
			"name" : fileName,
			"data" : null,
			"written" : false
		};
		this.files.push(newRef);
		return newRef;
	}
	
	this._incrementCounter = function() {
		this.remainingFiles++;
	}
	
	this._decrementCounter = function(depName) {
		this.remainingFiles--;
		if(typeof this.fileReadyCallback == 'function') {
			this.fileReadyCallback(this.remainingFiles, depName);
		}
	}
	
	/* The following functions enqueue operations for playback using
	   syncEmscriptenFS. The reason for this is that it is often
	   useful to begin populating the file system before Emscripten
	   is actually started.
	 */
	
	this.makeDir = function(dirPath) {
		this.dirs.push({"path" : dirPath, "written" : false});
	}
	
	/* Prepares to write binary data the Emscripten FS
	 *
	 *   dstFileName : Name used to write file to the Emscripten FS
	 *   srcUrl :      URL for the resource
	 */
	this.writeFileFromBinaryData = function(dstFileName, srcData) {
		this._fileRef(dstFileName).data = new Uint8Array(srcData);
	}
	
	/* Causes a file to be retrieved via HTTP from a URL and prepares
	 * it to be written to the Emscripten FS
	 *
	 *   dstFileName : Name used to write file to the Emscripten FS
	 *   srcUrl :      URL for the resource
	 */
	this.writeFileFromUrl = function(dstFileName, srcUrl) {
		var me = this;
		this._incrementCounter();
		fetchFile(srcUrl,
			function(response) {
				me.print("Downloading " + srcUrl);
				me.writeFileFromBinaryData(dstFileName, response);
				me._decrementCounter(dstFileName);
			},
			function(status) {
				if(status == 404) {
					me.print("Downloading " + srcUrl + "... Failed, file not found");
				} else {
					me.print("Downloading " + srcUrl + "... Failed, status:" + status);
				}
			}
		);
	}
	
	/* Copies data from a File object and prepares it to be written
	 * to the Emscripten FS
	 *
	 *   dstFileName : Name used to write file to the Emscripten FS
	 *   srcFile :     Exiting file object
	 */
	this.writeFileFromFile = function(dstName, srcFile) {
		var me = this;
		this._incrementCounter();
		var reader = new FileReader();
		reader.onload = function(evt) {
			if(evt.target.readyState != 2) return;
			if(evt.target.error) {
				me.print('Error while reading file');
				return;
			}
			var name = dstName || srcFile.name;
			me.writeFileFromBinaryData(name, evt.target.result);
			me._decrementCounter(name);
		}
		reader.readAsArrayBuffer(srcFile);
	};
	
	/* Wraps a callback in such a way that the callback is treated
	 * as a dependency.
	 */
	
	this.waitForCallback = function(callback, depName) {
		var me = this;
		this._incrementCounter();
		return function(arg1, arg2, arg3) {
			callback(arg1, arg2, arg3);
			me._decrementCounter(depName);
		}
	}
}
