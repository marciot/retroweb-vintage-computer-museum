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

function FileManager() {
	this.dirs  = new Array();
	this.files = new Array();
	
	/* The following function performs enqueued file operations
	 * on an Emscripten FS object.
	 */
	this.writeEmscriptenFS = function(FS) {
		// Create subdirectories
		for (var i = 0; i < this.dirs.length; ++i) {
			var d = this.dirs[i];
			FS.mkdir (d.path);
			console.log("Creating directory " + d.path);
		}
		
		// Write files
		for (var i = 0; i < this.files.length; ++i) {
			var f = this.files[i];
			console.log("Writing " + f.name + " to Emscripten FS");
			FS.writeFile(f.name, new Uint8Array(f.data), { encoding: 'binary' });
		}
	}
	
	/* The following functions will behave differently depending on whether
	   the emulator is running. If it is, they will perform the file operations
	   immediately. Otherwise, the operations are enqueued so that
	   writeEmscriptenFS will perform them once the emulator has started up. */
	
	this.makeDir = function(path) {
		if( typeof FS == 'undefined' ) {
			this.dirs.push({"path" : path});
		} else {
			FS.mkdir (path);
			console.log("Creating directory " + path);
		}
	}
	
	this.writeFileFromBinaryData = function(name, data, isBootable) {
		if( typeof FS == 'undefined' ) {
			// Defer loading of file until emulator resources are loaded
			this.files.push({"name" : name, "data" : data});
			if (isBootable) {
				emuState.bootMediaLoaded();
			}
		} else {
			// Emulator is already running, mount immediately
			console.log("Mounting data on " + name);
			try {
				FS.unlink(name);
			} catch (err) {
			}
			FS.writeFile(name, new Uint8Array(data), { encoding: 'binary' });
			emulatorMountDisk(name);
		}
	}
	
	this.writeFileFromUrl = function(name, url, isBootable) {
		var me = this;
		console.log("Fetching " + url);
		showStatus("Downloading...");
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.responseType = "arraybuffer";
		xhr.onload = function(e) {
			showStatus(false);
			me.writeFileFromBinaryData(name,xhr.response, isBootable);
		};
		xhr.send();
	}
}

function mountDriveFromUrl(drive, url, isBootable) {
	fileManager.writeFileFromUrl(emulatorGetDrives()[drive],url,isBootable);
}

function mountDriveFromData(drive, data, isBootable) {
	fileManager.writeFileFromBinaryData(emulatorGetDrives()[drive],data,isBootable);
}

function EmulatorState() {
	this.loaded = false;
	this.running = false;
	this.gotRom = false;
	this.gotBootMedia = false;
	this.floppyDrives = new Array();
	
	popups.open("popup-rom-missing");
	
	this.start = function() {
		fetchDataFromUrl("startup.json", processStartupConfig);
	}
	
	this.configLoaded = function() {
		loadEmulatorResources(getPlatform());
	}
	
	this.emscriptenPreInit = function() {
		popups.close("popup-status");
		fileManager.writeEmscriptenFS(FS);
	}
	
	this.emscriptenPreRun = function() {
		emulatorPreRun();
		this.running = true;
	}
	
	this.romsLoaded = function() {
		this.gotRoms = true;
		popups.close("popup-rom-missing");
		popups.open("popup-need-boot-media");
	}
	this.bootMediaLoaded = function() {
		popups.close("popup-need-boot-media");
		if(!this.running) {
			this.requestRestart();
		}
	}
	this.requestRestart = function() {
		if (!this.romsLoaded || this.gotBootMedia) {
			return;
		}
		if (!this.loaded) {
			showStatus("Starting emulator...");
			// Need to delay a bit otherwise the status will not update
			setTimeout(loadEmulator, 100);
			this.loaded = true;
			return;
		}
		if(!this.running) {
			run();
		} else {
			emulatorReset();
		}
	}
	this.isRunning = function() {
		return this.running;
	}
	this.addFloppyDrive = function(fname) {
		this.floppyDrives.push({"fname" : fname, "mounted" : false});	
	}
	this.getFloppyObj = function(fname) {
		for (var i = 0; i < this.floppyDrives.length; ++i) {
			if(this.floppyDrives[i].fname == fname) {
				return this.floppyDrives[i]; 
			};
		}
		return undefined;
	}
	this.floppyMounted = function(fname) {
		this.getFloppyObj(fname).mounted = true;
	}
	this.isFloppyMounted = function(fname) {
		return this.getFloppyObj(fname).mounted;
	}
}

function createEmscriptenModule() {
	var statusElement = document.getElementById('status');
	var progressElement = document.getElementById('progress');
	var macStatus = document.getElementById('popup-status');
	var module = {
		preRun: [function () {emuState.emscriptenPreRun();}],
		postRun: [],
		preInit: [function () {emuState.emscriptenPreInit();}],
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
		canvas: document.getElementById('screen'),
		setStatus: function(text) {console.log("Emscripten Status Update: " + text);},
		totalDependencies: 0,
		monitorRunDependencies: function(left) {
			if(left > 0) {
				popups.open("popup-status");
			} else {
				popups.close("popup-status");
			}
		}
	};
	return module;
}

function loadEmulatorResources(emuPlatform) {
	console.log("Loading emulator resources");
	loadResource(emuPlatform + "/ui.css");
	loadResource(emuPlatform + "/glue.js");
}

function loadEmulator() {
	emulatorConfigModule(Module);
	loadResource(emuPlatform + "/" + getPlatform() + ".js", true);
	//loadResource(emuPlatform + "/" + getPlatform() + ".js.gz", true);
}

var romFileName;
var emuPlatform;

/* Platform drop-down menu */
function addPlatform(platform, title) {
	var label  = document.createTextNode(title);
	var option = document.createElement("option");
	option.appendChild(label);
	option.value = platform;
	document.getElementById("platform-select").appendChild(option);
}

/* onChange handler for the platform drop-down menu */
function onPlatformChange() {
	var platformMenu = document.getElementById('platform-select');
	var newPlatform = "platform=" + platformMenu.options[platformMenu.selectedIndex].value;
	var newPage = new String(window.location);
	if(newPage.indexOf("?") != -1) {
		newPage = newPage.replace(/platform=[a-zA-Z0-9-]+/i, newPlatform);
	} else {
		newPage = newPage + "?" + newPlatform;
	}
	window.location = newPage;
}

function setPlatform(platform) {
	emuPlatform = platform;
}

function getPlatform() {
	return emuPlatform;
}

function processStartupConfig(json) {
	var startupConfig = json["startup-config"];
	if (
		typeof startupConfig == 'undefined' ||
		typeof startupConfig.version == 'undefined' ||
		typeof startupConfig.emulators == 'undefined'
	) {
		throw new LoadException ("Index fails startup-config JSON format validation");
	}
	
	for(var platform in startupConfig.emulators) {
		addPlatform(platform, startupConfig.emulators[platform].name);
	}
	
	platformConfig = startupConfig.emulators[getPlatform()];
	
	if (platformConfig == undefined) {
		throw new LoadException ("The startup.json file does not contain a stanza corresponding to this platform");
	}
	
	var doc = initialDoc || platformConfig["initial-doc"] || startupConfig["initial-doc"];
	if(doc) {
		fetchResource(doc);
	}
		
	var dirsToMake = platformConfig["mkdir"];
	if(dirsToMake) {
		for (var i = 0; i < dirsToMake.length; ++i) {
			var path = dirsToMake[i];
			fileManager.makeDir(path);
		}
	}
	
	function filePart(path) {
		return path.substr(path.lastIndexOf("/")+1);
	}
		
	var filesToMount = platformConfig["preload-files"];
	for (var i = 0; i < filesToMount.length; ++i) {
		if (filesToMount[i].charAt(0) == '#') continue;
		var parts = filesToMount[i].split(/\s+->\s+/);
		var url = parts[0];
		var name = (parts.length > 1) ? parts[1] : filePart(parts[0]);
		fileManager.writeFileFromUrl('/' + name, url);
	}
	if (!platformConfig["ask-for-rom"]) {
		emuState.romsLoaded();
	} else {
		romFileName = platformConfig["ask-for-rom"];
	}
	emuState.configLoaded();
}

function showStatus(text) {
	var statusElement = document.getElementById('status');
	if (!text) {
		popups.close("popup-status");
	} else {
		statusElement.innerHTML = text;
		popups.open("popup-status");
	}
}

/* Upload from local disk functionality */

function mountLocalFile(drive, isBootable) {
	document.getElementById('uploader-text').innerHTML = "Select floppy disk image";
	document.getElementById('uploader-ok-btn').onclick = function(evt) {
		popups.close("popup-uploader");
		var file = document.getElementById('uploaderfile').files[0];
		if(!window.FileReader) return; // Browser is not compatible
		var reader = new FileReader();
		reader.onload = function(evt) {
			if(evt.target.readyState != 2) return;
			if(evt.target.error) {
				showStatus(false);
				alert('Error while reading file');
				return;
			}
			mountDriveFromData(drive, evt.target.result,isBootable);
			showStatus(false);
		};
		showStatus("Loading...");
		reader.readAsArrayBuffer(file);
		return false;
	}
	popups.open("popup-uploader");
}

function restartComputer() {
	emuState.requestRestart();
}

/* This object handles visibility transitions from one object to the next
 */
function TransitionManager() {
	this.visibleElement;
	this.speed = 0;
	this.allowConcurrent = false;
	
	this.makeVisible = function(el,speed) {
		if(el == this.visibleElement) {
			return;
		}
		if(typeof speed == 'undefined') {
			speed = this.speed;
		}
		if(this.visibleElement && el) {
			if(this.allowConcurrent) {
				$(this.visibleElement).fadeOut(speed);
				$(el).fadeIn(speed);
			} else {
				$(this.visibleElement).fadeOut(speed,
					function() {$(el).fadeIn(speed);});
			}
		} else if(this.visibleElement && !el) {
			$(this.visibleElement).fadeOut(speed);
		} else {
			$(el).fadeIn(speed);
		}
		this.visibleElement = el;
	}
	
	this.setSpeed = function(speed, allowConcurrent) {
		this.speed = speed;
		this.allowConcurrent = allowConcurrent;
	}
}

/* This object manages popup dialog boxes. Since our pop-up boxes are translucent,
 * this object ensures that only the topmost popup box is visible at once.
 */
function PopupManager(tm) {
	this.transitionManager = tm;
	this.popupBoxes = new Array();
	
	this.add = function(id) {
		this.popupBoxes.push({"id" : id, "open" : false});
	};
	this.setState = function(id, state) {
		for (var i = 0; i < this.popupBoxes.length; ++i) {
			if (id == this.popupBoxes[i].id) {
				this.popupBoxes[i].open = state;
			}
		}
	};
	this.apply = function(speed) {
		var topmost;
		for (var i = 0; i < this.popupBoxes.length; ++i) {
			if (this.popupBoxes[i].open) {
				topmost = this.popupBoxes[i].id;
			}
		}
		tm.makeVisible(document.getElementById(topmost),speed);
	}
	this.open = function(id,speed) {
		this.setState(id, true);
		this.apply(speed);
	};
	this.close = function(id, speed) {
		this.setState(id, false);
		this.apply(speed);
	};
}

function clickShowNavigator() {
	panels.setState('html-viewer',false);
	panels.setState('navigator-panel',true);
	panels.apply();
}

function clickShowViewer() {
	panels.setState('html-viewer',true);
	panels.setState('navigator-panel',false);
	panels.apply();
}

/* This object saves the contents of a DOM element so that it can be restored
 * later.
 */
function StateSnapshot(id) {
	this.state = null;
	this.what_id = id;
	this.capture = function() {
		this.state = document.getElementById(this.what_id).cloneNode(true);
		return this;
	};
	this.restore = function() {
		var element = document.getElementById(this.what_id);
		var parent = element.parentNode;
		parent.replaceChild(this.state.cloneNode(true), element);
	};
	return this;
}

function showHtmlViewer(url) {
	var iframe = document.getElementById("html-iframe");
	if(url) {
		if(endsWith(url, '.wiki')) {
			panels.open("html-viewer");
			injectWikiContent(iframe, url);
		} else {
			panels.open("html-viewer");
			iframe.src = url;
		}
		$("html,body", iframe.contentWindow.document).scrollTop(0);
	} else {
		iframe.src = "about:blank";
	}
}

var wikiTemplate;

function injectWikiContent(element, url) {
	if(wikiTemplate == null) {
		$.ajax({
			url: "wiki-template.html",
			success: function (data) {
				wikiTemplate = data;
				injectWikiContent(element, url);
			},
			error: function(jqXHR,textStatus) {alert("Failed to load wiki template:" + textStatus)}
		});
	} else {
		$.ajax({
			url: url,
			success: function (data) {
				$(element.contentWindow.document).empty();
				html = wikiTemplate.replace(/\$WIKI_CONTENT/g, wikify(data))
								   .replace(/\$PARENT_BASE_URL/g, removeTrailingSlash(''+window.location.pathname))
					               .replace(/\$WIKI_BASE_URL/g, removeTrailingSlash(baseUrl(url)));
				element.contentWindow.document.open();
				element.contentWindow.document.write(html);
				element.contentWindow.document.close();
			},
			error: function(jqXHR,textStatus) {alert("Failed to load URL:" + textStatus)}
		});
	}
}