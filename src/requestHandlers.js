/*
 *
 * requestHandlers.js – This is how we handle requests
 *
 */
"use strict";

// Use URL module for cleaner code 
const url = require("url");

// Import HTTP module
const http = require('http');



// const formidable = require("formidable");
const fs = require("fs");
const server = require("../server.json");

// Parses DOM 
const jsdom = require("jsdom");

// Parser 
const parser = require("./dataParser.js");

// Used in the root 
const handler_root = function (request, response) {
	// Read and print to the response
	fs.readFile(server.html.root, function(err, data) {
		// Don't even attempt 
		if (err) {
			console.log(err);
			return;
		}
		
		// If we have an error, don't do anything.
		response.writeHead(200, { 
			"Content-Type": "text/html" 
		});
		
		// Respond
		response.write(data);
		response.end();
	});
};

// Used to check if the files exist 
const handler_requestContains = function(fname, onFound, notFound) {	
	// If try see if it exists...
	fs.exists(fname, function (exists) {
		if (!exists) {
			notFound();
			return;
		}
		
		// Call parser
		onFound();
	});
}

// Used when we need to run a request 
const handler_request = function (request, response) {
	// Log it 
	const parsed = url.parse(request.url, true);
	const queries = parsed.query;
	
	// Get the year, measure, format
	const year = queries["year"];
	const measure = queries["measure"];
	const format = queries["format"];
	
	// IF we have an option 
	const qOpt = queries["option"];
	const qIncludes = (qOpt == undefined) || (qOpt == null);
	const option = (qIncludes) ? qOpt : null;
	
	// AND what months we want
	const months = queries["months[]"];
	
	// On success 
	const onSuccess = function(data) {
		response.writeHead(200, { 
			"Content-Type": "application/json" 
		});
		response.write(JSON.stringify(data));
		response.end();
	};
	
	// On Failure
	const onFail = function(err) {
		response.writeHead(500, { 
			"Content-Type": "application/json" 
		});
		
		// Replace backslash and double up
		const placeable = (""+err).split('\\').join('/');
		response.write(`{ \"err\": \"${placeable}\"}`);
		response.end();
	};
	
	// Get the info.
	const serverpath = "http://eris.ad.murdoch.edu.au/~S900432D/ict375/data/";
	const localpath = "./data/";
	const extensions = [
		".xml", ".json"
	];
	const possibleNames = [
		localpath + year + extensions[0],
		localpath + year + extensions[1]
	];
	const serverFNames = [
		serverpath + year + extensions[0],
		serverpath + year + extensions[1]
	];
	
	// Check if either file exists 
	let found = false;
	for (let i = 0; i < possibleNames.length; i++) {
		// The file name 
		const fname =  possibleNames[i];
		const serverPath = serverFNames[i];
		
		// If try see if it exists...
		handler_requestContains(fname, function () {
			// Get parse...
			parser.parse(fname, queries, onSuccess, onFail);
		}, function () {
			// If we found it, the next part of the code will not be relevent
			// Attempt to get the resource 
			http.get(serverPath, function(response) {
				// If we didn't get an "OK" 
				if (response.statusCode != 200) {
					// We failed!
					return;
				}
				
				// We will now create a new file stream
				const fname = localpath + year + extensions[i];
				let fstream = fs.createWriteStream(fname);
				
				// We will now write to this file stream...
				response.pipe(fstream);
				fstream.on("finish", function() {
					// We will save the file, then run it.
					parser.parse(fname, queries, onSuccess, onFail);
				});
			}).on("error", function(error) {
				return;
			});
		}, onSuccess, onFail);
	}
};

// When we want to return all the valid values
const handler_validInputs = function (request, response) {
	// Create objects...
	let data = {};
	
	// Add our data
	data["year"] = [ ];
	data["measurement"] = [ "Wind Speed", "Solar Radiation", "Both" ];
	data["format"] = [ "Table", "Graph", "Both" ];
	data["interp"] = [ "Linear", "Quadratic", "Spline" ];
	
	
	response.writeHead(200, { 
		"Content-Type": "application/json" 
	});
	
	// Check what years we have in our fs
	const datadir = "http://eris.ad.murdoch.edu.au/~S900432D/ict375/data/";
	const files = http.get(datadir, function(resp) {
		// If we didn't get an "OK" 
		if (response.statusCode != 200) {
			// We failed!
			return;
		}
		
		// These are the valid years that we have found
		let rData = "";
		resp.on("data", function(chunk) { 
			rData += chunk; 
		});
		resp.on("end", function() {
			
			// Gets the elements 
			const dom = new jsdom.JSDOM(rData);
			let eItems = dom.window.document.getElementsByTagName("a");
			const fnameRegex = /[0-9]+\.((xml)|(json))/;
			for (let i = 0; i < eItems.length; i++) {
				// Get the item 
				let e = eItems[i];
				let href = e.getAttribute("href");
				if (href.match(fnameRegex)) {
					// If it matches...
					const year = href.split(".")[0];
					const extension = href.split(".")[1];
					data["year"].push(1*year);
				}
			}
			
			// If we don't have anything, set year to whatever.
			if (data["year"] == undefined || data["year"].length < 1) {
				data["year"] = [ 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016 ];
			} 
			
			// Send the response and be on our day.
			response.write(JSON.stringify(data));
			response.end();
			
			// We will now create a new file stream
			// const fname = "./data/" + year + extensions[i];
			// let fstream = fs.createWriteStream(fname);
			// 
			// // We will now write to this file stream...
			// response.pipe(fstream);
			// fstream.on("finish", function() {
			// 	// We will save the file, then run it.
			// 	parser.parse(fname, queries, onSuccess, onFail);
			// });
		});
		
	}).on("error", function(error) {
		data["year"] = [ 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016 ];
		response.write(JSON.stringify(data));
		response.end();
		return; 
	});
};

// Used when we don't know where a resource is
const handler_notfound = function (request, response) {
	// Read and print to the response
	fs.readFile(server.html.notfound, function(err, data) {
		// Don't even attempt 
		if (err) {
			response.writeHead(404, { "Content-Type": "text/html" });
			response.write(`Could not find \"${request.url}\".`);
			response.end();
			return;
		}
		
		// If we have an error, don't do anything.
		response.writeHead(404, { 
			"Content-Type": "application/html" 
		});
		
		// Respond
		response.write(data);
		response.end();
	});
};

// Get the type of the file
const handler_staticContentType = function (fname) {
	// Get extension 
	const ftokens = fname.split(".");
	if (ftokens.length < 2) {
		return "text/plain";
	}
	
	const fext = ftokens[ ftokens.length - 1 ].toLowerCase();
	
	const extensions = {
		"css": "text/css",
		"js": "application/javascript",
		"jpg": "image/jpeg",
		"jpeg": "image/jpeg",
		"png": "image/png",
		"json": "application/json",
		"xml": "text/xml"
	};
	
	if (!extensions[fext]) {
		return "text/plain";
	}
	
	return extensions[fext];

}

// Give it statically.
const handler_static = function(request, response) {
	// Read and print to the response
	fs.readFile(process.cwd() + "/public/" + request.url.split('?')[0], function(err, data) {
		// Don't even attempt 
		if (err) {
			response.writeHead(400, { "Content-Type": "text/html" });
			response.write(`Could not find \"${request.url}\".`);
			response.end();
			return;
		}
		
		// If we have an error, don't do anything.
		response.writeHead(200, { 
			"Content-Type": handler_staticContentType(request.url)
		});
		
		// Respond
		response.write(data);
		response.end();
	});
};

// Read all static...
const handler_readStaticPath = function(path) {
	fs.readdir(`./public/${path}`, function(err, files) {
		if (err) {
			console.log(`Cannot read directory ./public/${path}.`);
			return;
		}
		
		for (let i = 0; i < files.length; i++) {
			exports[`/${path}/` + files[i]] = handler_static;
		}
	});
};

exports["/"] = handler_root;
exports["/request"] = handler_request;
exports["/valid"] = handler_validInputs;
exports["/notfound"] = handler_notfound;

// Add static imports...
handler_readStaticPath("js");
handler_readStaticPath("css");
handler_readStaticPath("img");