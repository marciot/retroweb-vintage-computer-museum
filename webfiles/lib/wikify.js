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

/* Removes embedded JSON content from the wiki markup. If a jsonStorage object
 * is provided, all JSON content will be parsed and placed in the object as
 * a property; a "code" HTML tag whose id corresponds to the property in the
 * jsonStorage object will serve as a placeholder.
 */
function json(str, jsonStorage) {
	str = str.replace( /^{\s*"[\w-]+"\s*:\s*(?:.|\n)+?^}/gm, function(m) {
		if(jsonStorage) {
			var id = 'json_' + Object.keys(jsonStorage).length;
			try {
				jsonStorage[id] = JSON.parse(m);
				return '<code id="' + id + '"></code>';
			} catch (e) {
				throw new Error(e.message + " (parsing " + id + ")");
			}
		}
		return '';
	});
	return str;
}

function lists(str) {
	str = str.replace( /(?:^[#].*$\n?)+/gm, '<ol>\n$&</ol>');
	str = str.replace( /(?:^[*].*$\n?)+/gm, '<ul>\n$&</ul>');
	str = str.replace( /^[#*] .*(?:\n[#*]{2}.*)*$/gm, '<li>\n$&\n</li>');
	str = str.replace( /^[#*][ ]*/gm, '');
	return str;
}

function headers(str) {
	return str.replace(/^(=+)[ ]*(.*)[ ]*\1/gm, function(a,b,c)
		{return '<h' + b.length + '>' + c + '</h' + b.length + '>'});
}

function def_lists(str) {
	str = str.replace( /(?:^[;:].*$\n?)+/gm, '<dl>\n$&\n</dl>');
	str = str.replace( /^; (.*)$/gm, '<dt>$1</dt>');
	str = str.replace( /^: (.*)$/gm, '<dd>$1</dd>');
	return str;
}

function preformatted(str) {
	str = str.replace( /^([ ]{1,2}).*$(?:\n\1.*$)*/gm,
		function(m,w) {
			m = m.replace(RegExp('^'+w,'gm'),'');
			return (w == '  ') ? ('<blockquote>' + m + '</blockquote>')
				               : ('<pre>'        + m + '</pre>');
		}
	);
	return str;
}

function table_row(m,p) {
	var a = p.split('|');
	var modifierRegex = /^(!?)([>^]?)(\d*)(,?\d*)(.*)$/;
	var s = "";
	for(i=0; i<a.length; i++) {	
		var args = a[i].match(modifierRegex);
		var attr = "";
		if(args[2] == '^') {
			attr += ' class="align-center"';
		}
		if(args[2] == '>') {
			attr += ' class="align-right"';
		}
		if(args[3] != '') {
			attr += ' colspan="' + args[3] + '"';
		}
		if(args[4] != '') {
			attr += ' rowspan="' + args[4].substring(1) + '"';
		}
		if(args[1] == '!') {
			s += '<th' + attr + '>' + args[5] + '</th>';
		} else {
			s += '<td' + attr + '>' + args[5] + '</td>';
		}
	}
	return '<tr>' + s + '</tr>';
}

function tables(str) {
	str = str.replace( /(?:^[|].*$\n?)+/gm, '<table>\n$&</table>');
	str = str.replace( /^[|](.*)[|]$/gm, table_row);
	return str;
}

function formatting(str) {
	str = str.replace( /'''([^']+)'''/gm, '<strong>$1</strong>');
	str = str.replace( /''([^']+)''/gm, '<em>$1</em>');
	return str;
}

function figs(str) {
	// Figures and Images
	str = str.replace( /\[\[[Ff]igure-?([A-Za-z0-9-]*):([^ ]+) ?(.*)\]\]/gm,
		function(m, className, src, caption) {
			var attr = "";
			if(className != '') {
				attr = 'class="' + className + '" ';
			}
			if(caption != '') {
				return '<figure ' + attr + '><img src="' + src + '"><figcaption>' + caption + '</figcaption></figure>';
			} else {
				return '<figure ' + attr + '><img src="' + src + '"><figure>';
			}
		});
	str = str.replace( /\[\[[Ii]mage-?([A-Za-z0-9-]*):([^ ]+)\]\]/gm,
		function(m, className, src) {
			var attr = "";
			if(className != '') {
				attr = 'class="' + className + '" ';
			}
			return '<img ' + attr + 'src="' + src + '">';
		});
	return str;
}

function links(str) {	
	// Internal links
	str = str.replace( /\[\[([^\]|]+)\]\]/g, '<a href="$1">$1</a>');
	str = str.replace( /\[\[([^\]|]+)\|([^\]]+)\]\]/g, '<a href="$2">$1</a>');
	
	// Reference
	str = str.replace( /\[\d+\]/g, '<a class="reference">$&</a>');
	
	// External links
	str = str.replace( /\[(http[^\] ]+) ([^\]]+)\]/g,  '<a href="$1" target="new">$2</a>');
	str = str.replace( /\[(http[^\] ]+)\]/g,           '<a href="$1" target="new">$1</a>');
	str = str.replace( /([^">])(http[^\]<\n ]+)/g,      '$1<a href="$2" target="new">$2</a>');
	
	return str;
}

function paragraphs(str) {
	str = str.replace( /^(?:\w[^\n]+\n)+/gm, '<p>$&</p>');
	return str;
}

function wikify (str, jsonStorage) {
	str = formatting(tables(links(figs(headers(def_lists(preformatted(lists(lists(lists(lists(lists(paragraphs(json(str,jsonStorage))))))))))))));
	return str;
}