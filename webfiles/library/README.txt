This is a sample of how to package disk images and indices for use by the RetroWeb
Browser.

On your webserver, you will need to make available one or more JSON index files and
disk images that are compatible with the PCE emulator.

If you wish to allow others to hyperlink to your resources, you will also have to
configure your web server to allow sharing of resources across domain boundaries.

This is documented in "http://enable-cors.org," but for apache users, I have included
a ready-to-use "apache.htaccess" file. Simply rename that to ".htaccess" and you'll be
good to go.