/*
 *
 * graph.js – This is how we create graphs.
 *
 */
"use strict";
const fs = require("fs");
const canvas = require("canvas"); 

// Used to loop through records 
const graph_forEachRecord = function(records, func) {
	// Get the years in the records...
	for (const year in records)
	for (let i = 0; i < 12; i++) {
		// Get the record 
		const month = i + 1;
		const record = records[year][month];
		func(record, month, year);
	}
};

// Used to create a graph.
const graph_create = function(records, type) {
	// If the point has over 0 records, it is a real record 
	const trackWS = (type == "Wind Speed" || type == "Both");
	const trackSR = (type == "Solar Radiation" || type == "Both");
	
	// If it has 0, it is interpolated
	
	// Get the amount of years.
	const years = Object.keys(records);
	const yearAmount = years.length;
	const monthAmounts = 12*yearAmount;
	
	// Canvas data..
	const cWidth = 1400;
	const cPadding = 10;
	const cHeight = 800;
	
	// Create a canvas. 
	const c = canvas.createCanvas(cWidth + 50, cHeight);
	const context = c.getContext("2d");
	context.font = "20px Calibri";
	
	// Change our records to integers.
	const xStart = 12*years[0];
	const xEnd   = 12*years[years.length - 1];
	
	// Get highest y and lowest y.
	let wsYStart = records[0];
	let wsYEnd = records[0];
	let srYStart = records[0];
	let srYEnd = records[0];
	
	// Get the years in the records...
	graph_forEachRecord(records, function(record, month, year) {
		// If there is no record don't bother it
		if (record == null) {
			return;
		}
		
		// If we have the ws/sr is smaller / bigger than min/max 
		if (wsYStart == null || record.ws < wsYStart.ws) {
			wsYStart = record;
		}
		if (wsYEnd == null   || record.ws > wsYEnd.ws) {
			wsYEnd = record;
		}
		// If we have the ws/sr is smaller / bigger than min/max 
		if (srYStart == null || record.sr < srYStart.sr) {
			srYStart = record;
		}
		if (srYEnd == null   || record.sr > srYEnd.sr) {
			srYEnd = record;
		}
	});
	
	// pixelPerX / pixelPerY
	let wsYDistance = Math.abs(wsYEnd.ws - wsYStart.ws);
	let srYDistance = Math.abs(srYEnd.sr - srYStart.sr);
	let xScale = (cWidth  - 2*cPadding)/monthAmounts;
		
	// Used to print x
	let x = cPadding;
	let y = cHeight;
	let wsY = 0;
	let srY = 0;
	
	// max text size 
	const maxTextSize = context.measureText("00/0000");
	maxTextSize.height = 20;
	const textPadding = 5;
	
	// Set old values for later 
	let oldX = x;
	let oldWSY = null;
	let oldSRY = null;
	
	
	// These are things to make our graph render pretty
	const indent = (cHeight - 2*cPadding);
	const playspace = (cHeight-4*cPadding);
	
	// Set rounded heights 
	let amount = 10;
	const heightChange = (cHeight/amount);
	const wsChange = wsYDistance / amount;
	const srChange = srYDistance / amount;
	wsY = wsYStart.ws;
	srY = srYStart.sr;
	for (let i = 0; i < amount; i++) {
		// Formatting nonsense
		context.linewidth = 1;
		context.beginPath();
		context.strokeStyle = "black";
		context.filLStyle = "black";
		
		context.moveTo(0, y);
		context.lineTo(cWidth, y);
		context.stroke();
		
		// Create a textbox.
		context.fillStyle = "black";
		context.fillRect(0, 
						 y - maxTextSize.height - textPadding,
						 maxTextSize.width + 2*textPadding, 
						 maxTextSize.height + 4*textPadding);
						 
		if (trackWS ^ trackSR) {	 
			const val = (trackWS) ? wsY.toPrecision(3) : srY.toPrecision(3) ; 
			context.fillStyle = (trackWS) ? "lightblue" : "orange";
			context.fillText(val, 
							 x, 
							 y - maxTextSize.height + 4*textPadding);
		} else if (trackWS && trackSR) {
			// Record both...
			context.fillStyle = "lightblue";
			context.fillText(wsY.toPrecision(3), 
							 x, 
							 y - maxTextSize.height + 2*textPadding);
			context.fillStyle = "orange";
			context.fillText(srY.toPrecision(3), 
							 x, 
							 y - maxTextSize.height + 6*textPadding);
		}
						 
		// Increment the height
		y -= heightChange;
		wsY += wsChange;
		srY += srChange;
	}
	
	// Begin to start. 
	graph_forEachRecord(records, function(record, month, year) {
		// Increment the x/y value 
		x += xScale;
		
		// Create a vertical line 
		{
			context.lineWidth = 1;
			context.beginPath();
			context.strokeStyle = "black";
			context.fillStyle = "black";
			
			context.moveTo(x, 0)
			context.lineTo(x, cHeight)
			
			context.stroke();
		}
		
		// Don't do anything if we don't have anything.
		if (record == null) {
			return
		}
		
		// Set stroke non-sense 
		context.lineWidth = 10;
		
		// Move to x and begin to draw SR
		if (trackWS) {
			wsY = indent - (record.ws - wsYStart.ws) / (wsYDistance) * playspace + cPadding;
			
			context.beginPath();
			context.strokeStyle = "blue";
			context.fillStyle = "blue";
			
			context.moveTo(oldX, (oldWSY != null) ? oldWSY : wsY);
			context.lineTo(x, wsY);
			context.stroke();
		}
		// Track SR?
		if (trackSR) {
			srY = indent - (record.sr - srYStart.sr) / (srYDistance) * playspace + cPadding;
			
			context.beginPath();
			context.strokeStyle = "red";
			context.fillStyle = "red";
			
			context.moveTo(oldX, (oldSRY != null) ? oldSRY : srY);
			context.lineTo(x, srY);
			context.stroke();
		}
					
		// Create text box
		context.fillStyle = "black";
		context.fillRect(x - (maxTextSize.width+textPadding)/2, 
						 (cHeight - cPadding) - (maxTextSize.height+textPadding) / 2,
						 maxTextSize.width + 2*textPadding, 
						 maxTextSize.height + 2*textPadding);
		context.fillStyle = "yellow";
		const dateStr = ((month < 10)? '0' : '') + month + "/" + year;
		context.fillText(dateStr, 
		                 x - 3*textPadding - maxTextSize.width/4, 
						 (cHeight - cPadding) + 2*textPadding);
						 
		// Get the old value for x 
		oldX = x;
		oldWSY = wsY;
		oldSRY = srY;
	});
	
	// Draw 
	const fname = "./public/img/graph.png";
	let fos = fs.createWriteStream(fname);
	let png = c.createPNGStream();
	png.pipe(fos);
	return "./img/graph.png";
};

// Allow the graph to be found
exports["create"] = graph_create;