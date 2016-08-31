
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

/* A "data-emulator" attribute on #retroweb-markup will indicate what emulators are compatible with an article.
 */
function getCompatibleEmulators() {
	var el = document.getElementById("retroweb-markup");
	if(el && el.hasAttribute("data-emulators")) {
		return el.getAttribute("data-emulators").trim().split(/\s+/);
	} else {
		return emulatorsChoices;
	}
}
/* This function checks whether the proposed emulator is compatible with the page and returns an alternative
 * if it is not.
 */
function needAlternativeEmulator(emulator) {
	var compatibleEmulators = getCompatibleEmulators();
	if(compatibleEmulators.indexOf(emulator) == -1) {
		return chooseEmulator();
	}
	return false;
}

function chooseEmulator() {
	var choices = getCompatibleEmulators();
	return choices[Math.floor((Math.random()*choices.length))];
}

function populateEmulatorList() {
	addEmulator("mame-apple2e",  "Apple IIe");
	addEmulator("pce-macplus",   "Apple Macintosh");
	addEmulator("pce-atarist",   "Atari 1040ST");
	addEmulator("mame-c64",      "Commodore 64");
	addEmulator("sae-amiga",     "Commodore Amiga 500");
	addEmulator("pce-ibmpc",     "IBM PC Model 5150 (w/ cassette interface)");
	addEmulator("pce-ibmpc-xt",  "IBM PC Model 5160 (IBM PC XT)");
	addEmulator("pce-rc759",     "Regnecentralen RC759 Piccoline");
	addEmulator("mame-trs80",    "Tandy/RadioShack TRS-80 Model 1");
	addEmulator("xerox-star",    "Xerox 8010 Information System (Xerox Star)");
	addEmulator("salto-alto",    "Xerox Alto");
}