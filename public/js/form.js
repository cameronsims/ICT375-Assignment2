// Clear the bin 
const form_clearBin = function() {
	// Get the error bin...
	let eBin = $("#error-container");
	
	// Kill all besides first...
	eBin.empty();
};

// Used to get variables from the server
let form_validData = {};

// Used to fill the valid data 
const form_getValidData = function(onSuccess, onFail) {
	// Get from the server... 
	$.ajax({
		"url": "./valid",
		"method": "GET",
		"success": function (data) {
			// Create parts
			form_validData["year"] = data["year"];
			form_validData["measurement"] = data["measurement"];
			form_validData["format"] = data["format"];
			form_validData["interp"] = data["interp"];
			onSuccess();
		},
		"error": function (request, text, err) {
			// Create parts
			form_validData["year"] = [ ];
			form_validData["measurement"] = [ ];
			form_validData["format"] = [ ];
			form_validData["interp"] = [ ];
			onFail(`${err} (${text})`);
		}
	});
	
	
};

// Get the years on offer.
const form_getYears = function () {
	return form_validData["year"];//[ 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016 ];
};

// Get the measurements on offer 
const form_getMeasurement = function () {
	return form_validData["measurement"];//[ "Wind Speed", "Solar Radiation", "Both" ];
};

// Get the format on offer
const form_getFormat = function () {
	return form_validData["format"];;// [ "Table", "Graph", "Both" ];
};

// Get the interp on offer 
const form_getInterp = function () {
	return form_validData["interp"];;// [ "Linear", "Quadratic", "Spline" ];
};

// Used to spit out errors 
const form_invalid = function(str) {
	// Get the error bin...
	let eBin = $("#error-container");
	form_clearBin();
	
	// Create a element 
	let e = $( document.createElement("p") );
	e.text("Error: " + str);
	
	// Add our cool new friend
	eBin.append(e);
};

// Create table 
const form_createTable = function(frag, rows) {
	// Used to hold month
	let eRows = [ ];
	for (let i = 0; i < rows; i++) {
		// Create the row and add it
		eRows[i] = $(document.createElement("tr"));

		// Add it
		frag.append(eRows[i]);
	}
	
	return eRows;
};

// Create years 
const form_createYears = function() {
	// Create Fragment 
	let yearFrag = $(document.createDocumentFragment());
	
	// This makes the form print these years.
	const form_years = form_getYears();
	
	// Month and year columns 
	const yearCols = 5;
	const yearRows = 2;
	let rows = form_createTable(yearFrag, yearRows);
	
	// For every single year we have...
	for (let i = 0; i < form_years.length; i++) {
		// Get the year 
		const year = form_years[i];
		
		// Create a  checkbox.
		let eCheck = $(document.createElement("input"));
		eCheck.attr("name", "year");
		eCheck.attr("value", year);
		eCheck.attr("type", "radio");
		eCheck.attr("checked", (i == 0));
		
		// Create a label
		let eLabel = $(document.createElement("label"));
		eLabel.text(year);
		eLabel.prepend(eCheck);
		
		// Add it to a span 
		let eSpan = $(document.createElement("span"));
		eSpan.append(eLabel);
		
		// Add the span to the row 
		const row = Math.floor(i / yearCols);
		rows[row].append(eSpan);
	}
	
	// Give bacl the frag 
	return yearFrag;
};

// Create years 
const form_createMonths = function() {
	// Create Fragment 
	let monthFrag = $(document.createDocumentFragment());

	// Months...
	const form_months = {
		1: "January",  2: "February",  3: "March",
		4: "April",    5: "May",       6: "June",
		7: "July",     8: "August",    9: "September", // SEPTEMBER!!! 
		10: "October", 11: "November", 12: "Decemeber"
	};

	// Used to hold month
	const monthCols = 3;
	const monthRows = 4;
	let rows = form_createTable(monthFrag, monthRows);

	// Used to iterate through the map
	let i = 0;
	
	// For every single year we have...
	for (const month in form_months) {
		// Get the name of the month...
		const monthName = form_months[month];
		const monthNumber = (month < 10) ? ('0' + month) : (month);
		
		// Add the checkbox and label
		let eCheck = $(document.createElement("input"));
		eCheck.attr("name", "month"+monthNumber);
		eCheck.attr("type", "checkbox");
		eCheck.attr("checked", false);
		
		// Create a label
		let eLabel = $(document.createElement("label"));
		eLabel.text(monthName);
		eLabel.prepend(eCheck);
		
		// Add it to a span 
		let eSpan = $(document.createElement("td"));
		eSpan.append(eLabel);
		
		// Add the span to the row 
		const row = Math.floor(i / monthCols);
		rows[row].append(eSpan);
		
		i++;
	}

	// Give bacl the frag 
	return monthFrag; 
};

// Create what weather measurement we want...
const form_createMeasurements = function() {
	// Create a fragment.
	const frag = $(document.createDocumentFragment());
	
	// Create a radio 
	const names = form_getMeasurement();
	for (let i = 0; i < names.length; i++) {
		// Add the checkbox and label
		const name = names[i];
		let eCheck = $(document.createElement("input"));
		eCheck.attr("name", "measurement");
		eCheck.attr("value", name);
		eCheck.attr("type", "radio");
		eCheck.attr("checked", (i == 0));
		
		// Create a label
		let eLabel = $(document.createElement("label"));
		eLabel.text(name);
		eLabel.prepend(eCheck);
		
		// Add it to a span 
		let eSpan = $(document.createElement("span"));
		eSpan.append(eLabel);
		
		frag.append(eSpan);
	}
	
	return frag;
};

// Create what output format we want 
const form_createOutput = function () {
	// Create a fragment.
	const frag = $(document.createDocumentFragment());
	const select = $(document.createElement("select"));
	select.attr("name", "output");
	
	// Create a radio 
	const names = form_getFormat();
	for (let i = 0; i < names.length; i++) {
		// Add the option
		const name = names[i];
		
		// Create a label
		let eLabel = $(document.createElement("option"));
		eLabel.text(name);
		eLabel.val(name);
		select.append(eLabel);
	}
	
	frag.append(select);
	
	return frag;
};

// Create the interp menu
const form_createInterp = function() {
	// Create a fragment 
	const frag = $(document.createDocumentFragment());

	// The button deciding if we want to have interp on or off...
	let eCheck = $(document.createElement("input"));
	eCheck.attr("name", "interp");
	eCheck.attr("type", "checkbox");
	eCheck.attr("checked", true);

	// Used to decide if we want interpolation
	let eLabel = $(document.createElement("label"));
	eLabel.text("Enable");
	eLabel.prepend(eCheck);
	
	frag.append(eLabel);

	// Get the options element 
	let eOptions = $("#interp-options");

	// Create the actual option
	let eSelect = $( document.createElement("select") );
	eSelect.attr("name", "interp-type");
	eOptions.append(eSelect);
	
	// Add allowed options
	const opts = form_getInterp();
	for (let i = 0; i < opts.length; i++) {
		let eOpt = $(document.createElement("option"));
		eOpt.text(opts[i]);
		eOpt.val(opts[i]);
		eSelect.append(eOpt);
	}

	// Add functionality to the options...
	eCheck.click(function() {
		let isOn = eCheck.is(":checked");
		if (isOn) {
			eOptions.css("display", "inline-block");
		} else {
			eOptions.css("display", "none");
		}
	});

	return frag;

};

// Used to create the form, with all it's inputs...
const form_create = function() {
	// Get the year fragments.
	const eYears  = $("#year-container");
	const years = form_createYears();
	eYears.append(years);
	
	// Get months
	const eMonths = $("#month-container");
	const months = form_createMonths();
	eMonths.append(months);
	
	// Get measurements 
	const eMeasurements = $("#measurements-container");
	const measurements = form_createMeasurements();
	eMeasurements.append(measurements);
	
	// Get output format 
	const eFormat = $("#format-container");
	const formats = form_createOutput();
	eFormat.append(formats);

	// Add a interp
	const eInterp = $("#interp-container");
	const eInterpOptions = $("#interp-options");
	const interp = form_createInterp();
	interp.insertBefore(eInterpOptions);
	
}

// Get the value of a radio 
const form_getRadioValue = function(name) {
	// Get values
	const years = $("[name=\"" + name + "\"]");
	for (let i = 0; i < years.length; i++) {
		// Return value if checked
		if (years[i].checked) {
			return $(years[i]).val()
		}
	}
	
	return null;
};

// Are any of a radio button valid?
const form_validateRadio = function (name) {
	// Get years 
	const elems = $("[name=\"" + name + "\"]");
	for (let i = 0; i < elems.length; i++) {
		// Check if it is valid
		if (elems[i].checked) {
			return true;
		}
	}
	
	// We failed, it is not valid.
	return false;
};

// Are the years valid?
const form_validateYears = function() {
	// Check years...
	return form_validateRadio("year");
};

// Are the months valid?
const form_validateMonths = function() {
	// Get month amount 
	const MONTH_AMOUNT = 12;
	for (let i = 0; i < MONTH_AMOUNT; i++) {
		// Get the value of the month...
		let monthValue = i + 1;
		let monthNumber = (monthValue < 10) ? ('0' + monthValue) : (monthValue);
		let monthString = "month" + monthNumber;
		
		// Get element name 
		let eMonth = $("[name=\"" + monthString + "\"]");
		if (eMonth.is(":checked")) {
			return true;
		}
	}
	
	// If none matched, it is false.
	return false;
}

// Are the measurements valid?
const form_validateMeasurements = function () {
	// Check measurements...
	return form_validateRadio("measurement");
};

// Are the output valid?
const form_validateOutput = function () {
	// Check measurements...
	const eOutput = $("[name=\"output\"]");
	if (eOutput.length == 0) {
		return false;
	}
	
	// Return if valid.
	return form_getFormat().includes(eOutput.val());
};

// Do we have interp, and is it valid?
const form_validateInterp = function () {
	// Get the interp...
	const eInterp = $("[name=\"interp\"]");
	if (eInterp.length == 0) {
		return false;
	}
	
	// Find checkboxes.
	let isOn = eInterp.is(":checked");
	
	// If it is on...
	if (isOn) {
		// If we have selected a valid selection.
		let eSelect = $("[name=\"interp-type\"]");
		if (eSelect.length == 0) {
			return false;
		}
		
		// Get option
		let eOption = eSelect.val();
		if (!form_getInterp().includes(eOption)) {
			return false;
		}
	}
	
	// It is valid.
	return true;
};

// Used to validate the form 
const form_validate = function(event) {
	// Check valid years
	if (!form_validateYears()) {
		form_invalid("No year selected!");
		return false;
	}
	
	// Check valid month
	if (!form_validateMonths()) {
		form_invalid("No month(s) selected!");
		return false;
	}
	
	// Check valid measurements
	if (!form_validateMeasurements()) {
		form_invalid("No measurement selected!");
		return false;
	}
	
	// Check valid output
	if (!form_validateOutput()) {
		form_invalid("No format selected!");
		return false;
	}
	
	// Check interp
	if (!form_validateInterp()) {
		form_invalid("Invalid interp!");
		return false;
	}
	
	return true;
};

// Used to properly submit the form once we find that it is valid 
const form_submitResponse = function () {
	// Get the year 
	const format = $("[name=\"output\"]").val();
	const interp = $("[name=\"interp\"]").is(":checked");
	const interpOption = $("[name=\"interp-type\"]").val();
	
	// Get all the multi values 
	let year = form_getRadioValue("year");
	let measure = form_getRadioValue("measurement");
	
	// Get all the months 
	const monthsLength = 12;
	let months = [];
	for (let i = 0; i < monthsLength; i++) {
		// Get the month name
		const monthVal = i + 1;
		const monthNumber = (monthVal < 10) ? ('0' + monthVal) : monthVal;
		
		// If valid, add it.
		let elem = $("[name=\"month"+monthNumber + "\"]");
		if (elem.is(":checked")) {
			months.push(monthVal);
		}
		
	}
	
	// We will now try to create a get arguments 
	let args = [
		"year=" + year,
		"measure=" + measure,
		"format=" + format
	];
	
	// If we have an interp
	if (interp) {
		// Get the option
		args.push("option=" + interpOption);
	}
	
	// Add every single month.
	for (let i = 0; i < months.length; i++) {
		args.push("months[]=" + months[i]);
	}
	
	// Format the get.
	let longArgument = "?";
	for (let i = 0; i < args.length; i++) {
		// aDd new non-sense
		longArgument += args[i];
		
		// If not the last...
		if (i < args.length - 1) {
			longArgument += '&';
		}
	}
	
	// Get url.
	const url = "./request" + longArgument;
	$.ajax({
		"url": url,
		"method": "GET",
		"success": form_response,
		"error": form_onFail
	});
};

// Used when we get a response 
const form_response = function(data) {
	// Create table 
	let eTable = $("#output-container table");
	let eTBody = $("#output-body");
	let frag = $(document.createDocumentFragment());
	
	// Get the image 
	let eGraph = $("#output-img");
	let eLegend = $("#output-img div");
	let eImg = $("#output-img img");
	eImg.removeAttr("src");
	
	// Get columns...
	const trackName = $("[name=\"output\"]").val();
	const trackWS = (trackName == "Table" || trackName == "Both");
	const trackSR = (trackName == "Table" || trackName == "Both");
	
	// Display / hide the body
	eTable.css("display", (trackWS) ? "block" : "none");
	eGraph.css("display", (trackSR) ? "block" : "none");
	
	// IF we have an image, refresh 
	if (data["img"]) {
		// Force reload
		const ntropy =  new Date().valueOf();
		eImg.attr("src", data["img"] + "?ts=" + ntropy);
	}
	
	// Clear every element.
	eTBody.empty();
	
	// Get all the year(s) that were responded with.
	for (const year in data) {
		// Don't do anything if it is img 
		if (year == "img") {
			continue;
		}
		
		// Get the month
		const records = data[year];
		
		// Get the month 
		for (const month in records) {
			// Get the record 
			const record = records[month];
			
			// Create a row
			let eRow = $(document.createElement("tr"));
			const colAmount = 3;
			
			// Add month and year 
			const dates = [ year, month ];
			for (let j = 0; j < dates.length; j++) {
				let elem = $(document.createElement("td"));
				elem.text(dates[j]);
				eRow.append(elem);
			}
			
			if (record == null) {
				// Add null columns 
				for (let j = 0; j < colAmount; j++) {
					eRow.append( document.createElement("td") );
				}
			} else {
				// Get the vals 
				const vals = [
					(trackWS) ? record.ws.toPrecision(6) + " km/h" : "", 
					(trackSR) ? record.sr.toPrecision(6) + " kWh/m^2" : "", 
					record.amount ];
						
				// Add the columns...
				for (let j = 0; j < colAmount; j++) {
					let eCol = $(document.createElement("td"));
					eCol.text(vals[j]);
					eRow.append(eCol);
				}
			}
			
			// Add to the fragment 
			frag.append(eRow);
		}
	}
	
	// Add to the body 
	eTBody.append(frag);
};

// Used when we fail 
const form_onFail = function(request, text, err) {
	let status = request.status;
	form_invalid(`Failed to get the resource with the status code: ${status}`);
};

// Used to submit the form 
const form_submit = function(event) {
	// Prevent refresh / new call
	event.preventDefault();
	form_clearBin();

	// If not valid 
	if (!form_validate()) {
		return false;
	}
	
	// Get the 
	form_submitResponse();
};

// Used to reset the form elements to null...
const form_reset = function() {
	// Reset every single value...
	form_clearBin();
	
	// Static radios.
	const radios = [ "year", "measurement" ];
	const drops = [ "output", "interp-type" ];
	
	// Clear all the options 
	for (let i = 0; i < radios.length; i++) { 
		let eRadios = $("[name=\"" + radios[i] + "\"]");
		eRadios.attr("checked", false);
	}
	
	// Clear the drop downs.
	for (let i = 0; i < drops.length; i++) {
		let eDrop = $("[name=\"" + drops[i] + "\"]");
		eDrop.val(null);
	}
};


// Once the webpage is ready call this
$(document).ready(function() {
	// Get the form element(s)...
	
	// When we submit a function...
	$("#form-request").submit(form_submit);
	$("#form-request button[type=\"submit\"]").click(function() {
		$("#form-request").submit()
	});
	
	// Set the form to create 
	form_getValidData(form_create, form_invalid);
});