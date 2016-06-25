
var emulatorsChoices = [];

/* Emulator drop-down menu */
function addEmulator(emulator, title) {
	var label  = document.createTextNode(title);
	var option = document.createElement("option");
	option.appendChild(label);
	option.value = emulator;
	document.getElementById("emulator-select").appendChild(option);

	emulatorsChoices.push(emulator);
}

/* onChange handler for the emulator drop-down menu */
function onEmulatorChange() {
	var emulatorMenu = document.getElementById('emulator-select');
	navTo("/?emulator=" + emulatorMenu.options[emulatorMenu.selectedIndex].value);
}

function chooseEmulator() {
	return emulatorsChoices[Math.floor((Math.random()*emulatorsChoices.length))];
}

function populateEmulatorList() {
	addEmulator("jsmess-apple2e","Apple IIe");
	addEmulator("pce-macplus",   "Apple Macintosh");
	addEmulator("pce-atarist",   "Atari 1040ST");
	addEmulator("jsmess-c64",    "Commodore 64");
	addEmulator("sae-amiga",     "Commodore Amiga 500");
	addEmulator("pce-ibmpc",     "IBM PC Model 5150 (w/ cassette interface)");
	addEmulator("pce-ibmpc-xt",  "IBM PC Model 5160 (IBM PC XT)");
	addEmulator("pce-rc759",     "Regnecentralen RC759 Piccoline");
	addEmulator("jsmess-trs80",  "Tandy/RadioShack TRS-80 Model 1");
	addEmulator("xerox-star",    "Xerox 8010 Information System (Xerox Star)");
}