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

/* Sets the class for an icon. If the class is not defined, then the
 * class becomes the data-type, else hyperlink if there is no data-type
 */
function setDefaultIconClass(e) {
	if(e.className == "") {
		if(e.getAttribute("data-type")) {
			$(e).addClass(e.getAttribute("data-type"))
		} else {
			$(e).addClass("hyperlink");
		}
	}
}

/* The following function expands the "x-icons" tag, which is intermediate markup for
 * rendering hyper-links as icons. Due to the verbosity of such markup, JSON blocks
 * are used in most wiki pages.
 *
 * <x-icons class="classes">
 *    <a>...</a>
 *    <a>...</a>
 * </x-icons>
 *
 * Becomes:
 *
 * <div class="icons classes">
 *   <ol>
 *      <li><a>...</a></li>
 *      <li><a>...</a></li>
 *   </ol>
 * </div>
 *
 */
function expandRetrowebIcons(element) {
	// Wrap A with LI tags
	$("x-icons>A",element).each(function(i,e) {
		setDefaultIconClass(e);
		$(e).replaceWith($('<li>'+e.outerHTML+'</li>'));
	});
	// Replace the x-icons with DIV, OL
	$("x-icons",element).each(function(i,e) {
		$(e).replaceWith('<div class="icons ' + e.className + '"><ol>'+e.innerHTML+'</ol></div>');
	});
}

function processBootOptions(opts) {
	if(opts && "emulator-args" in opts) {
		var args = opts["emulator-args"];
		for(var arg in args) {
			emuState.getEmulatorInterface().setArgument(arg, args[arg]);
		}
	}
}

/* Converts a name into an URL by converting spaces to hyphens and appending .html */
function implicitUrlFromName(name) {
	return name.replace(/ /g,'-')+".html";
}

function navFetchDriveFromUrl(name, drive, url, isBootable) {
	gaTrackEvent("disk-mounted", name);
	mountDriveFromUrl(drive, url, isBootable);
}

function navProcessIconClick(name, type, param, opts) {
	opts = opts ? JSON.parse(opts) : {};
	type = type ? type : "folder";
	switch(type) {
		case "doc":
		case "folder":
		case "folder-dot":
			gaTrackEvent("document-read", name);
			navTo(param || trailingLinks.lookup(name) || implicitUrlFromName(name));
			break;
		case "boot-hd":
			processBootOptions(opts);
			navFetchDriveFromUrl(name, "hd1", param, true);
			break;
		case "boot-floppy":
			processBootOptions(opts);
			navFetchDriveFromUrl(name, "fd1", param, true);
			break;
		case "boot-rom":
		case "power":
			processBootOptions(opts);
			gaTrackEvent("disk-mounted", name);
			emuState.getEmulatorInterface().bootFromRom();
			break;
		case "floppy":
			if(emuState.isRunning()) {
				navFetchDriveFromUrl(name, (opts && opts.drive) ? opts.drive : "fd1", param, false);
			} else {
				alert("Please boot the computer using a boot disk first");
			}
			break;
		case "upload-floppy":
			gaTrackEvent("disk-mounted", "local-floppy");
			uploadFloppy("fd1", true);
			break;
		case "download-floppy":
			downloadFloppy("fd1");
			break;
		case "download-file":
			downloadFile(param);
			break;
		case "upload-file":
			uploadFile(param, "cassette file (.cas)");
			break;
		case "get-file":
			getFileFromUrl(param, opts.saveAs);
			break;
		case "cassette":
			cassetteAction(param);
			break;
		case "hyperlink":
			window.open(param);
			break;
		default:
			alert("Action " + type + " is unknown");
			break;
	}
	return false;
}