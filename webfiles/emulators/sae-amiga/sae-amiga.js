var config;
var FS;

init();
start();

function toBinaryString(data) {
	var bytes = new Uint8Array(data);
	var str = "";
	for(var i = 0; i < bytes.length; i++) {
		str += String.fromCharCode(bytes[i]);
	}
	return str;
}

function writeRoms(data) {
	console.log("Got ROM:" + data.byteLength );
	var rom = toBinaryString(data);
	console.log("Got ROM:" + rom.length );
	if (!(data.byteLength == 0x40000 || data.byteLength == 0x80000)) {
		alert('Invalid rom-size, 256 or 512kb.');	
		return;
	}
	config.rom.size = (data.byteLength == 0x40000) ? SAEV_Config_ROM_Size_256K : SAEV_Config_ROM_Size_512K;
	config.rom.data = rom;
}

function init() {
	/*var el = document.getElementById( 'screen' );
	el.parentNode.removeChild( el );*/

	SAE({cmd:'init'});

	info = SAE({cmd:'getInfo'}); 
	config = SAE({cmd:'getConfig'}); 
	
	config.video.id = 'screen-div';
	
	config.cpu.speed = SAEV_Config_CPU_Speed_Original;
	config.cpu.compatible = true;

	config.chipset.mask = SAEV_Config_Chipset_Mask_OCS;
	config.chipset.agnus_dip = false; /* A1000 */
	config.chipset.collision_level = SAEV_Config_Chipset_ColLevel_None;

	config.blitter.immediate = true;
	config.blitter.waiting = config.blitter.immediate ? 0 : 1;
	
	config.ram.chip.size = SAEV_Config_RAM_Chip_Size_512K;
	config.ram.slow.size = SAEV_Config_RAM_Slow_Size_512K;
	config.ram.fast.size = SAEV_Config_RAM_Fast_Size_1M;
			
	config.audio.enabled =  true;
	if (config.audio.enabled) {
		config.audio.mode = SAEV_Config_Audio_Mode_Play_Best;
		config.audio.channels = SAEV_Config_Audio_Channels_Stereo;
		config.audio.rate = SAEV_Config_Audio_Rate_44100;
	}
		
	config.video.id = 'screen';
	config.video.enabled = true;
	config.video.scale = false;
	config.video.framerate = 1;
	config.video.ntsc = false;

	config.keyboard.enabled = true;
	config.keyboard.mapShift = false;
	
	config.mouse = {};
	config.mouse.scaleX = 1.5;
	config.mouse.scaleY = 1.5;

	config.serial.enabled = false;
		
	/*config.hooks.error = func;
	config.hooks.power_led = func;
	config.hooks.floppy_motor = func;
	config.hooks.floppy_step = func;
	config.hooks.fps = func;					
	config.hooks.cpu = func;	*/
	
	writeRoms(fileManager.getFileBinaryData("/sae.rom"));
	
	// Make fake Emscripten object
	FS = {};
	FS.mkdir = function() {};
	FS.write = function() {};
	FS.close = function() {};
	FS.open = function() {};
}

function start() {
	SAE({cmd:'start'});
	emuState.emscriptenPreInit();
	emuState.emscriptenPreRun();
}

