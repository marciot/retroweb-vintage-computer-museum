
Retroweb Vintage Computer Museum
================================

![alt text][logo]

This JavaScript framework allows you to easily develop content-rich, fully-interactive
websites that make use of JavaScript computer emulators to teach your visitors about
computer history.

The code presented here is the foundation of the [RetroWeb Vintage Computer Museum](http://retroweb.maclab.org).

The text for all articles in the museum are included in this repository, but the ROMs for the
emulators and disk files are not included.

This framework has been written generally enough that it may be modified for use by any
JavaScript emulator. The currrent release comes with the following emulators:

* PCE (http://www.hampa.ch/pce)
	* Apple Macintosh Plus
	* IBM PC Model 5150 and 516o
	* Regnecentralen RC759 Piccoline
* JSMESS (http://jsmess.textfiles.com)
	* Apple //e
	* Commodore 64
	* Tandy TRS-80 Model I
* Scripted AMIGA Emulator (http://scriptedamigaemulator.net)
	* Commodore Amiga 500

## Highlights of this framework:

1. An easy-to-use icon-based interface for managing the emulators.
2. A documentation viewer that runs right next to the emulated computer.
3. A Wiki-style markup for quick and simple development of content.
4. Realistic photographic skins to lend realism to the emulated computers.
5. Peer-to-peer networking using <a href="http://peerjs.com">PeerJS</a> and <a href="https://webrtc.org">WebRTC</a> for multi-player games.
6. Fully client-side JavaScript for easy hosting.
7. Modular design based on WebComponents and ECMA 6 classes.

## What libraries and technologies does this project use?

It uses WebComponents written in pure ECMA 6 JavaScript and will work natively in Chrome. For other browsers, a <a href="http://webcomponents.org/">WebComponents polyfill</a> is needed and is provided. With the polyfill, the code will work on
the latest versions of Chrome, Firefox and Safari.

## Why aren't you using Polymer or some other JavaScript framework?

I didn't learn with them and now I prefer to continue without them. Benjamin Farrell provides some good reasons in his blog post <a href="http://www.benfarrell.com/2015/10/26/es6-web-components-part-1-a-man-without-a-framework/">ES6 Web Components: A Man Without a Framework</a>

## Where are the build scripts or minimized source code?

There are none. This project does not have a build step. I upload the files to my webserver as is; the only tools I have used in development are a text editor, a web server and a web browser. In the future I may look into providing minimized source code.

## For developers
 
Several components that comprise this project have been packaged into separate WebComponents that can be used in other projects.
These components are available in the [RetroWeb Components](https://github.com/marciot/retroweb-components)
repository.

[logo]: https://github.com/marciot/retroweb-vintage-computer-museum/raw/master/webfiles/artwork/amiga-os.png "The screen of an emulated Amiga"