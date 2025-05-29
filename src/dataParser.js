/*
 *
 * dataParser.js – This is how we handle data
 *
 */
"use strict";
const fs = require("fs");
const xml2js = require("xml2js");
const xmlParser = new xml2js.Parser();

// Get our javascripts 
const graph = require("./graph.js");
const interp = require("./interp.js");

// Used to read a file 
const data_parse = function(fname, options, onSuccess, onFail) {
	fs.readFile(fname, function(err, data) {
		// Don't even attempt 
		if (err) {
			onFail(err);
			return;
		}
		
		// We will read this file...
		const tokens = fname.split('.');
		const fileExt = tokens[tokens.length - 1].toLowerCase();
		
		// If json 
		if (fileExt == "json") {
			data_parseJSON(data, options, onSuccess, onFail);
		} else if (fileExt == "xml") {
			data_parseXML(data, options, onSuccess, onFail);
		}
	});
};

// This is used to create a year.
const data_createYear = function(respData, year) {
	// Add it to the existing object
	respData[year] = {};
	
	// Set every single month 
	for (let j = 0; j < 12; j++) {
		respData[year][j + 1] = null;
	}
};

// Used to parse a record 
const data_parseRecord = function(record) {
	// IF we are XML, only get the first
	const dateAttr = (typeof(record["date"]) != typeof([])) ? record["date"] : record["date"][0];
	const timeAttr = (typeof(record["time"]) != typeof([])) ? record["time"] : record["date"][0];
	const windAttr = (typeof(record["ws"]) != typeof([])) ? record["ws"] : record["ws"][0];
	const solrAttr = (typeof(record["sr"]) != typeof([])) ? record["sr"] : record["sr"][0];
	
	// Get date
	const rDate = dateAttr;
	const date = { 
		"day":   1*rDate.substring(0, 2), 
		"month": 1*rDate.substring(3, 5), 
		"year":  1*rDate.substring(6) 
	};
	
	// Get the time
	const rTime = timeAttr;
	const time = { 
		"hour": 1*rTime.substring(0, 2), 
		"minute": 1*rTime.substring(3, 5) 
	};
	
	// Get wind and solar radiation
	return {
		"date": date,
		"time": time, 
		"ws": windAttr * 1,
		"sr": solrAttr * 1
	};
};

// Used to read an object. 
const data_parseData = function(data, options, onSuccess) {
	// root -> Weather -> Record[]
	const weather = data["weather"];
	const records = weather["record"];
	
	// These are the months that we are properly recording...
	const charMonths = options["months[]"];
	let months = [];
	for (let i = 0; i < charMonths.length; i++) {
		months.push(1*charMonths[i]);
	}
	
	// The return data. 
	const respData = {};
	
	// Last recorded date 
	let lastDate = null;
	
	// For each record...
	for (let i = 0; i < records.length; i++) {
		// We will read the record 
		const record = data_parseRecord(records[i]);
		const date = record.date;
		
		// If we don't want to measure the month...
		const checkMonth = months.includes(date.month);
		if (!checkMonth) {
			// We do not want to check it.
			continue;
		}
		
		// Same year? 
		//const sameYear =  (lastDate.year == date.year);
		//const sameMonth = (lastDate.month == date.month && sameYear);
		//const sameDay =   (lastDate.day == date.day && sameMonth);
		//const sameHour =  (lastTime.hour == time.hour && sameDay);
		//const sameMinute = (lastTime.minute == time.minute && sameHour);
		
		// Add to the records
		if (!respData[date.year]) {
			data_createYear(respData, date.year);
		}
		if (!respData[date.year][date.month]) {
			// Create a new record 
			respData[date.year][date.month] = {
				"amount": 0,
				"ws": 0,
				"sr": 0
			};
		}
		
		// Add the current data...
		let compiledRecord = respData[date.year][date.month];
		compiledRecord.ws += record.ws;	
		compiledRecord.sr += record.sr; 
		compiledRecord.amount++;
		
		// If the next record is different, OR doesn't exist.
		const isLast = (i + 1 == records.length);
		let nextIsDifferentMonth = false; 
		
		// If we're not the last, check the next record.
		if (!isLast) {
			// Check if the next record is another month
			const nextRecord = data_parseRecord(records[i + 1]);
			const sameYear =  (nextRecord.date.year == date.year);
			const sameMonth = (nextRecord.date.month == date.month && sameYear);
			
			nextIsDifferentMonth = !sameMonth;
		}
		
		if (isLast || nextIsDifferentMonth) {
			// Compile the record.
			
			// Total m/s -> Average km/h
			const msToKMH = 3.6;
			compiledRecord.ws *= msToKMH;
			compiledRecord.ws /= compiledRecord.amount;
			
			// Total W/m^2 -> kWh/m^2
			const WM2toKWHM2 = 1/6000;
			compiledRecord.sr *= WM2toKWHM2;
		}
		
		// Set last to this.
		lastDate = date;
	}

	// Parse Interp...
	if (options.option == "Linear") {
		interp.call(respData, 2, interp.linear);
	} else if (options.option == "Quadratic") {
		interp.call(respData, 3, interp.quadratic);
	} else if (options.option == "Spline") {
		interp.call(respData, 3, interp.spline);
	}
	
	// Create a graph...
	if (options.format != "Table") {
		respData["img"] = graph.create(respData, options.measure);
	}
	
	// On success...
	onSuccess(respData);
};

// Used to read a JSON file.
const data_parseJSON = function(data, options, onSuccess, onFail) {
	try {
		// Parse the text...
		const jsonData = JSON.parse(data);
		
		// Parse the object
		data_parseData(jsonData, options, onSuccess);
	} catch (e) {
		onFail(e);
		return;
	}
};

// Used to read an XML file.
const data_parseXML = function(data, options, onSuccess, onFail) {
	// Parse the text 
	xmlParser.parseString(data, function(err, xmlData) {
		// If we get an error...
		if (err) {
			onFail(err);
			return;
		}
	
		// Parse the object
		data_parseData(xmlData, options, onSuccess);
	});
};

// Parse 
exports["parse"] = data_parse;