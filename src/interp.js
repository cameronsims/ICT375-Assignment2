/*
 *
 * interp.js – This is how we interpolate the data.
 *
 */
"use strict";

// Used to get known values 
const interp_getKnown = function(records) {
	// We will get all known and unknown values...
	let known = [];
	let unknown = [];
	
	// Loop all our records
	for (const year in records)
	for (const month in records[year]) {
		// Simple way to store the key pair 
		const pair = { "year": year, "month": month };
		
		// If the record is valid 
		if (records[year][month] == null) {
			unknown.push(pair);
		} else {
			known.push(pair);
		}
	}
	
	return { "known": known, "unknown": unknown };
};

// Used to get the two closest known values 
const interp_getClosest = function(known, point, amount) {
	// We will get our closest amount of points 
	let vals = [];
	
	// If there is too little points.
	if (known.length < amount) {
		vals.length = amount;
		return vals.fill(null);
	}
	
	// If we have enough points, we will start from our closest value.
	let closest = 0;
	for (let i = 0; i < known.length; i++) {
		// Is it smaller, if so refresh the index 
		const smallerYear = 1*known[i].year < 1*point.year;
		const sameYearEarlierMonth = 1*known[i].year <= 1*point.year && 1*known[i].month < 1*point.month;
		if (smallerYear || sameYearEarlierMonth) {
			closest = i;
		}
	}
	
	// We now have the closest index, we will no go to either bounds and find the closest 
	const higherBound = known.length;
	const lowerBound = -1;
	
	// Iterators 
	let i = closest;
	let j = closest + 1;
	
	// "i" will iterate left, "j" will iterate right.
	while (vals.length < amount && (i > lowerBound || j < higherBound)) {
		// If we can go left 
		if (i > lowerBound) {
			// Add it
			vals.push(known[i]);
			i--;
		}
		
		// If we can go right
		if (vals.length < amount && j < higherBound) {
			// Add it
			vals.push(known[j]);
			j++;
		}
	}
	
	return vals;
}

// Used to get n amount of closest values and executes a interp method 
const interp_call = function(records, amount, interpFunc) {
	// Values 
	const values = interp_getKnown(records);
	const unknown = values.unknown;
	const known = values.known;
	
	// For all unknown values...
	for (let i = 0; i < unknown.length; i++) {
		// Get the point 
		const coords = values.unknown[i];
		
		// Find the two closest points. 
		const nearest = interp_getClosest(known, coords, amount);
		records[coords.year][coords.month] = interpFunc(records, coords, nearest);
	}
};

// Used to interpolate linearly
const interp_linear = function(records, coords, nearest) {
	// Don't do anything if not enough coords 
	if (nearest.length != 2) {
		return { "amount": 0, "ws": 0, "sr": 0 };
	}
	
	// Get our two values
	const left = nearest[0];
	const right = nearest[1];
	
	// If both aren't null, allow it.
	if (left == null || right == null) {
		return;
	}
	
	// We will get the distance between the two records.
	const lTotalMonths = 12*left.year + 1*left.month;
	const rTotalMonths = 12*right.year + 1*right.month;
	const lrDistance = rTotalMonths - lTotalMonths;
	const lRecord = records[left.year][left.month];
	const rRecord = records[right.year][right.month];
	
	// Change in both ws / sr 
	const wsDelta = (rRecord.ws - lRecord.ws)/lrDistance;
	const srDelta = (rRecord.sr - lRecord.sr)/lrDistance;
	
	// For every unit left, we want to increment our records.
	const totalMonths = 12*coords.year + 1*coords.month;
	const timeDistance = totalMonths - lTotalMonths;
	const wsInterp = lRecord.ws + wsDelta*timeDistance;
	const srInterp = lRecord.sr + srDelta*timeDistance;
				
	// Set the record...
	return {
		"amount": 0,
		"ws": wsInterp,
		"sr": srInterp
	};
};

// Used to interpolate quadratically
const interp_quadratic = function(records, coords, nearest) {
	// Find the two closest points. 
	const left = nearest[0];
	const center = nearest[1];
	const right = nearest[2];
	
	// If both aren't null, allow it.
	if (left == null || center == null || right == null) {
		return;
	}
	
	// Values 
	const totalMonths = 12*coords.year + 1*coords.month;
	
	// Get the left and right records...
	const lRecord = records[left.year][left.month];
	const cRecord = records[center.year][center.month];
	const rRecord = records[right.year][right.month];
	
	// y = y0 * L0(x) + y1 * L1(x) + y2*L2(x)
	const wsHeights = [ lRecord.ws, cRecord.ws, rRecord.ws ];// y...
	const srHeights = [ lRecord.sr, cRecord.sr, rRecord.sr ];// y...
	
	// Get time times in total months
	const times = [ // x...
		12*left.year   + 1*left.month,
		12*center.year + 1*center.month,
		12*right.year  + 1*right.month
	];                   
	
	// Polynomial functions! Very messy...
	const polynomials = [// L...(x)
		((totalMonths - times[1])*(totalMonths-times[2]))/((times[0]-times[1])*(times[0]-times[2])),  // (x-x1)(x-x2)/(x0-x1)(x0-x2)
		((totalMonths - times[0])*(totalMonths-times[2]))/((times[1]-times[0])*(times[1]-times[2])),  // (x-x1)(x-x2)/(x0-x1)(x0-x2)
		((totalMonths - times[0])*(totalMonths-times[1]))/((times[2]-times[0])*(times[2]-times[1]))	// (x-x1)(x-x2)/(x0-x1)(x0-x2)
	];
	
	// Calculate both interpolated values
	const wsInterp = wsHeights[0]*polynomials[0] + wsHeights[1]*polynomials[1] + wsHeights[2]*polynomials[2]; // y = y0 * L0(x) + y1 * L1(x) + y2*L2(x)
	const srInterp = srHeights[0]*polynomials[0] + srHeights[1]*polynomials[1] + srHeights[2]*polynomials[2]; // y = y0 * L0(x) + y1 * L1(x) + y2*L2(x)
				
	// Set the record...
	return {
		"amount": 0,
		"ws": wsInterp,
		"sr": srInterp
	};
	
};

// Used to interpolate via spline
const interp_spline = function(records, coords, nearest) {
	// Find the two closest points. 
	const left = nearest[0];
	const center = nearest[1];
	const right = nearest[2];
	
	// If both aren't null, allow it.
	if (left == null || center == null || right == null) {
		return;
	}
	
	// Values 
	const totalMonths = 12*coords.year + 1*coords.month;
	
	// Get the left and right records...
	const lRecord = records[left.year][left.month];
	const cRecord = records[center.year][center.month];
	const rRecord = records[right.year][right.month];
	
	// y = y0 * L0(x) + y1 * L1(x) + y2*L2(x)
	const wsHeights = [ lRecord.ws, cRecord.ws, rRecord.ws ];// y...
	const srHeights = [ lRecord.sr, cRecord.sr, rRecord.sr ];// y...
	
	// Get time times in total months
	const times = [ // x...
		12*left.year   + 1*left.month,
		12*center.year + 1*center.month,
		12*right.year  + 1*right.month
	];
	
	const timeBetweenXAnd1 = (totalMonths - times[1]); // x - x1
	const timeBetween2And1 = (times[2]-times[1]);	   // x2 - x1
	
	const wsHeightBetween2And1 = (wsHeights[2] - wsHeights[1]); // y2 - y1 
	const srHeightBetween2And1 = (srHeights[2] - srHeights[1]); // y2 - y1
	
	// Get differentials, these require 
	const wsX1Diff = (wsHeightBetween2And1)/(timeBetween2And1);	//dq/dt * 1/(x2-x1)
	const wsX2Diff = (wsHeightBetween2And1)/(timeBetween2And1);	//dq/dt * 1/(x2-x1)
	const srX1Diff = (wsHeightBetween2And1)/(timeBetween2And1);	//dq/dt * 1/(x2-x1)
	const srX2Diff = (wsHeightBetween2And1)/(timeBetween2And1);	//dq/dt * 1/(x2-x1)
	
	const distanceCoeff = timeBetweenXAnd1 / timeBetween2And1;       // t(x) = (x-x1)/(x2-x1)
	const wsACoeff = wsX1Diff*timeBetween2And1-wsHeightBetween2And1;   // a    =  k1(x2-x1)-(y2-y1)
	const srACoeff = srX1Diff*timeBetween2And1-srHeightBetween2And1;   // a    =  k1(x2-x1)-(y2-y1)
	const wsBCoeff = -wsX2Diff*timeBetween2And1+wsHeightBetween2And1;  // b    = -k2(x2-x1)+(y2-y1)
	const srBCoeff = -srX2Diff*timeBetween2And1+srHeightBetween2And1;  // b    = -k2(x2-x1)+(y2-y1)
	
	const invDistanceCoeff = (1-distanceCoeff);	//(1-t(x))
	
	const wsArg1 = invDistanceCoeff*wsHeights[1];	// (1-t(x))y1
	const srArg1 = invDistanceCoeff*srHeights[1];	// (1-t(x))y1
	
	const wsArg2 = distanceCoeff*wsHeights[2]; 		// t(x)y2
	const srArg2 = distanceCoeff*srHeights[2]; 		// t(x)y2
	
	const ceArg3 = distanceCoeff*invDistanceCoeff;	// t(x)(1-t(x))
	const wsArg3 = invDistanceCoeff*wsACoeff+distanceCoeff*wsBCoeff; // ((1-t(x)a+t(x)b);
	const srArg3 = invDistanceCoeff*srACoeff+distanceCoeff*srBCoeff; // ((1-t(x)a+t(x)b);
	
	const wsInterp = wsArg1 + wsArg2 + ceArg3*wsArg3; // q(x) = (1-t(x))y1 + t(x)y2 + t(x)(1-t(x))((1-t(x))a+t(x)b)
	const srInterp = srArg1 + srArg2 + ceArg3*srArg3; // q(x) = (1-t(x))y1 + t(x)y2 + t(x)(1-t(x))((1-t(x))a+t(x)b)
	
	// Set the record...
	return {
		"amount": 0,
		"ws": wsInterp,
		"sr": srInterp
	};
	
};


exports["call"] = interp_call;
exports["linear"] = interp_linear;
exports["quadratic"] = interp_quadratic;
exports["spline"] = interp_spline;