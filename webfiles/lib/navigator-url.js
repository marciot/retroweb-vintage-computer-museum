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

function NavigatorURL() {
	this.baseURL = "/";
	
	this.params = {};
	this.path = "/";
	this.search = "";
	this.href = "/";

	function parseUrl(url) {
		var site, path, search;
		
		/* Split the url into the pathname portion and the query */
		
		var searchPos = url.indexOf('?');
		if(searchPos != -1) {
			search  = url.substr(searchPos);
			path    = url.substr(0, searchPos);
		} else {
			path   = url;
			search = '';
		}
		site = urlSite(url);
		if(site) {
			path = path.substr(site.length);
		}
		return {
			"site"   : site,
			"path"   : path,
			"search" : search
		}
	}

	function urlIsAbsolute(url) {
		return url.match(/^[a-z]+:\/\//);
	}

	function urlSite(url) {
		var match = url.match(/^[a-z]+:\/\/[^\/?#]+/) 
		return match ? match[0] : null;
	}

	function baseUrl(url) {
		if(url.indexOf("/") != -1) {
			return url.replace(/\/[^/]+$/, "/");
		} else {
			return '';
		}
	}

	function urlFile (url) {
		return url.substr(url.lastIndexOf("/")+1);
	}

	this.rewriteRelativeUrl = function(url) {
		var rewritten = url;
		if (url && !urlIsAbsolute(url) && this.baseURL) {
			if(url.charAt(0) == '/') {
				rewritten = (urlSite(this.baseURL) || "") + url;
			} else {
				rewritten = baseUrl(this.baseURL) + url;
			}
		}
		if(!url) {
			url = this.baseURL;
		}
		/* Handle ".." by stripping out all occurrences of "dirname/.." */
		var dotdot = /[^/]+\/\.\.\//;
		while(rewritten.match(dotdot)) {
			rewritten = rewritten.replace(dotdot,'');
		}
		return rewritten;
	}

	function removeTrailingSlash(url) {
		return url.replace(/\/$/,'');
	}

	this.apply = function(url) {
		var u      = parseUrl(url);
		
		this.search = u.search;
		this.path   = u.path;
		this.params = u.search != '' ? parseQuery(u.search) : {};
		
		/* Figure out where we are going and adjust the URL */
			
		if(this.path == '') {
			this.path = window.location.pathname;
		} else {
			this.path  = this.rewriteRelativeUrl(this.path); 
		}
		
		/* Replace spaces in the path with dashes */
		
		this.path = this.path.replace(/ /g,'-');
		
		/* Transition to the new page */
		
		this.baseURL = this.path;
		this.href = this.path + this.search;
	}
}