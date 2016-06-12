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

/* This script injects the following two tags into the HEAD of a document:
 *
 *   <link rel="import" href="/lib/bootstrap.html">
 *   <script type="text/javascript" src="/lib/webcomponents/webcomponents.min.js">
 *
 * This is sufficient to initialize the RetroWeb Browser UI on an otherwise blank
 * HTML page */

/* Create a link to import the bootstrap file */
var fileref = document.createElement('link')
fileref.setAttribute("rel","import")
fileref.setAttribute("href", "/lib/bootstrap.html")
document.getElementsByTagName("head")[0].appendChild(fileref)

/* Load the webcomponents library */
var fileref = document.createElement('script')
fileref.setAttribute("type","text/javascript")
fileref.setAttribute("src", "/lib/webcomponents/webcomponents.min.js")
document.getElementsByTagName("head")[0].appendChild(fileref)