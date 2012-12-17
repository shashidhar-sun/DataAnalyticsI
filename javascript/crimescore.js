// Global variables and data structures
var map;
var service;
var i;
var csPlaces = {}; // the array in which you will score crime scores.
var mar = new Array();
var loc;
var ic;
var infowindow = new Array();
var marker = new Array();
var detailSearchTimers = new Array();
var demoNumber = 0;
var idleTime = 0;
var explorePlace = {};
var okToUpdate = true;
var exploreMarker = null;
var exploring = false;

var csPlace = function(lat, lng) {
	this.latitude = lat;
	this.longitude = lng;
	this.crimescore = -1;
	this.reference = -1;
	this.details = -1;
}

var processPlanner = function(json) {
	var first = json[0];
	explorePlace = first;
	
	for (elem in first) {
		if (elem != "lat" && elem != "long" && elem != "crime.score") {
			var value = first[elem];
			var mappedID = mapAttributeNames(elem);
			if (mappedID.indexOf("dist") != -1) {
				$("#" + mappedID + "Value").text(value.toFixed(2));
			} else {
				$("#" + mappedID + "Value").text(value);
			}
			$("#" + mappedID + "Slider").slider("value", value);
		}
	}
	
	$("#experimentCrimeScoreLogo").text("CrimeScore: " + first["crime.score"].toFixed(4));
	
	var greenRedInterpolator = d3.interpolateHsl("#00FF00", "#FF0000");
	var scaledCrimeScore = first["crime.score"] / 100;
	var url = 'http://www.googlemapsmarkers.com/v1/' + greenRedInterpolator(scaledCrimeScore).substring(1) +'/';
	var latLng = new google.maps.LatLng(first["lat"], first["long"]);
	
	if (!exploreMarker) {
		exploreMarker = new google.maps.Marker({
			position: latLng,
			map: map,
			icon: url
		});
	} else {
		exploreMarker.setIcon(url);
	}
}


// Main startup routine
var initialize = function() {
	$("#search").fadeIn(500);

	addSearchBoxListener();
	var mapOptions = {
		center: new google.maps.LatLng(38.89555, -77.0362),
		disableDefaultUI: true,
		zoomControl: true,
		zoomControlOptions: { position: google.maps.ControlPosition.LEFT_CENTER },
		zoom: 11,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	
	map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
	service = new google.maps.places.PlacesService(map);
	
	$("#resetAll").click(resetAll);
};

var launchExplore = function() {
	exploring = true;
	
	$("#search").fadeOut(500);
	$("#experiment").fadeIn(500);
	
	$(".plannerSlider").slider();
	$(".plannerSlider").on("slide", handleSliderChange);
	
	$("#experimentPointSelect").click(selectExperimentPoint);
	$("#submitPoint").click(selectSubmitPoint);
	
	resetExplore();
};

var launchSearch = function() {
	$("#search").fadeIn(500);
	$("#experiment").fadeOut(500);
}

var resetExplore = function() {
	$(".plannerSlider").each(function(index, element) {
		var sliderMin, sliderMax, sliderStep;
		
		if (index < 16) {
			sliderMin = 0;
			sliderMax = 100;
			sliderStep = 1;
		} else {
			sliderMin = 0;
			sliderMax = 14;
			sliderStep = 0.1;
		}
		$(element).slider("option", "min", sliderMin);
		$(element).slider("option", "max", sliderMax);
		$(element).slider("option", "step", sliderStep);
		$(element).slider("value", 0);
	});
	
	$("#liqcountSlider").slider("option", "max", 350);
	$("#industrialcountSlider").slider("option", "max", 500);
	$("#vacantcountSlider").slider("option", "max", 500);
	
	$(".parmValue").text("0");
	$("#experimentCrimeScoreLogo").text("");
};

var selectSubmitPoint = function()  {
		for(var i = 1; i<=15;i++ ) {
			explorePlaces.parameters[i+2] = parseInt($("#parm" + i.toString()  + "Value").text());
		}
		
		for(var i = 16; i<=18;i++ ) {
			explorePlaces.parameters[i+2] = parseInt($("#parm" + i.toString()  + "Value").text())/1000;
		}
	//Call backend HERE all data in explorePlaces.parameters
	
	
	console.log(explorePlaces);	
};

function timerIncrement() {
	idleTime = idleTime + 1;
	if (idleTime > 3) { //  20 secs
		selectSubmitPoint();
	}
}

// Add one-time click handler to select a new point for experiment mode
var selectExperimentPoint = function() {
	removeMarkers();
	resetExplore();

	google.maps.event.addListenerOnce(map, 'click', function(event) {
		csPlaces = {};
		map.panTo(event.latLng);
		var latitude = event.latLng.lat();
		var longitude = event.latLng.lng();
		getExperimentData([latitude, longitude]);
	});
}

// Map between returned attributes from web service and acceptable element ID stringss
var mapAttributeNames = function(attribute) {
	switch (attribute) {
		case "crime.score":
			return "crimescore";
		case "crimescore":
			return "crime.score";
		case "liq.count":
			return "liqcount";
		case "liqcount":
			return "liq.count";
		case "banks.count":
			return "bankscount";
		case "bankscount":
			return "banks.count";
		case "barber.count":
			return "barbercount";
		case "barbercount":
			return "barber.count";
		case "carlot.count":
			return "carlotcount";
		case "carlotcount":
			return "carlot.count";
		case "dorm.count":
			return "dormcount";
		case "dormcount":
			return "dorm.count";
		case "education.count":
			return "educationcount";
		case "educationcount":
			return "education.count";
		case "embassy.count":
			return "embassycount";
		case "embassycount":
			return "embassy.count";
		case "hospital.count":
			return "hospitalcount";
		case "hospitalcount":
			return "hospital.count";
		case "hotel.count":
			return "hotelcount";
		case "hotelcount":
			return "hotel.count";
		case "industrial.count":
			return "industrialcount";
		case "industrialcount":
			return "industrial.count";
		case "museum.count":
			return "museumcount";
		case "museumcount":
			return "museum.count";
		case "recreation.count":
			return "recreationcount";
		case "recreationcount":
			return "recreation.count";
		case "religious.count":
			return "religiouscount";
		case "religiouscount":
			return "religious.count";
		case "vacant.count":
			return "vacantcount";
		case "vacantcount":
			return "vacant.count";
		case "vehicleservice.count":
			return "vehicleservicecount";
		case "vehicleservicecount":
			return "vehicleservice.count";
		case "military.dist":
			return "militarydist";
		case "militarydist":
			return "military.dist";
		case "police.dist":
			return "policedist";
		case "policedist":
			return "police.dist";
		case "pub.housing.dist":
			return "pubhousingdist";
		case "pubhousingdist":
			return "pub.housing.dist";
		case "university.dist":
			return "universitydist";
		case "universitydist":
			return "university.dist";
	}
}

var handleSliderChange = function(event, ui) {
	var id = event.target.id.replace("Slider","");
	
	$("#" + id + "Value").text(ui.value);
	var mappedID = mapAttributeNames(id);
	explorePlace[mappedID] = ui.value;
	
	if (okToUpdate) {
		okToUpdate = false;
		setTimeout(function() { okToUpdate = true; }, 1000);
		getExperimentDataWithExistingData();
	}
};

// Get CrimeScores for an array of lat/lng coordinates
var getCrimeScores = function(array) {
	coordinates = "coords=" + array.join(",");
	callback = "&callback=?";
	data = coordinates + callback;
	$.getJSON("http://www.crimescore.us:8000/custom/crimescores", data);
}

// Get CrimeScore for a single lat/lng
var getCrimeScore = function(lat, lng) {
	getCrimeScores([lat,lng]);
}

var getExperimentData = function(array) {
	coordinates = "coords=" + array.join(",");
	callback = "&callback=?";
	data = coordinates + callback;
	$.getJSON("http://www.crimescore.us:8000/custom/planner", data);
}

var getExperimentDataWithExistingData = function() {
	
	var params = [];
	params.push(explorePlace["lat"]);
	params.push(explorePlace["long"]);
	params.push(explorePlace["liq.count"]);
	params.push(explorePlace["banks.count"]);
	params.push(explorePlace["barber.count"]);
	params.push(explorePlace["carlot.count"]);
	params.push(explorePlace["dorm.count"]);
	params.push(explorePlace["education.count"]);
	params.push(explorePlace["embassy.count"]);
	params.push(explorePlace["hospital.count"]);
	params.push(explorePlace["hotel.count"]);
	params.push(explorePlace["industrial.count"]);
	params.push(explorePlace["museum.count"]);
	params.push(explorePlace["recreation.count"]);
	params.push(explorePlace["religious.count"]);
	params.push(explorePlace["vacant.count"]);
	params.push(explorePlace["vehicleservice.count"]);
	params.push(explorePlace["military.dist"]);
	params.push(explorePlace["police.dist"]);
	params.push(explorePlace["pub.housing.dist"]);
	params.push(explorePlace["university.dist"]);
	coordinates = "coords=" + params.join(",");
	callback = "&callback=?";
	data = coordinates + callback;
	$.getJSON("http://www.crimescore.us:8000/custom/planner", data);
}

var removeMarkers = function() {
	for (var elem in csPlaces) {
		if (csPlaces[elem].marker) {
			csPlaces[elem].marker.setMap(null);
			delete csPlaces[elem];
		}
	}
};

var removeMarker = function(id) {
	if (csPlaces[id]) {
		csPlaces[id].marker.setMap(null);
		delete csPlaces[id];
	}
}

// Process returned CrimeScores
var processCrimeScores = function(data) {
	if (!exploring) {
		
		// Iterate over returned CrimeScores
		for (var i = 0; i < data.places.length ; i++) {
			// Store lat/lng
			var lat = parseFloat(data.places[i].latitude);
			var lng = parseFloat(data.places[i].longitude);

			// Get the id for this lat/lng
			var id = identifierForLatLng(lat, lng);


			// If there wasn't already an entry for this ID, make one
			if (csPlaces[id] === undefined)
				csPlaces[id] = new csPlace(lat, lng);

			var threshold = $("#crimeScoreThreshold").val();

			// Local pointer to csPlaces entry
			var place = csPlaces[id];

			// Add CrimeScore to structure
			place.crimescore = parseFloat(data.places[i].crimescore);

			if (place.crimescore < threshold) {
			
				// Color interpolator
				var greenRedInterpolator = d3.interpolateHsl("#00FF00", "#FF0000");
				var scaledCrimeScore = place.crimescore / 100;


				var url = 'http://www.googlemapsmarkers.com/v1/' + greenRedInterpolator(scaledCrimeScore).substring(1) +'/';
				var latLng = new google.maps.LatLng(place.latitude, place.longitude);
				place.marker = new google.maps.Marker({
					position: latLng,
					map: map,
					icon: url,
					animation: google.maps.Animation.DROP
				});

				var html = ""

				var columns = 0;

				if (place.details != -1) {
					if (place.details.name)
						html += "<div class='placeInfo-name'>" + place.details.name + "</div>";
					if (place.details.formatted_address)
						html += "<div class='placeInfo-address'>" + place.details.formatted_address + "</div>";

					html += "<div class='placeInfo-crimescore'><span class='placeInfo-crimescore-logo'>CrimeScore</span>" + Math.round(place.crimescore) + "</div>";
					html += "<div class='placeInfo-removeLink'><a href=\"javascript:removeMarker('" + identifierForLatLng(place.latitude, place.longitude) + "')\">Remove from Map</a></div>";
					html += "<table><tr>"

					if (place.details && place.details.photos)
						html += "<td><div class='placeInfo-image'><img src='" + place.details.photos[0].raw_reference.fife_url + "' /></div></td>";

					if (place.details.formatted_phone_number) {
						if (columns == 0) {
							html += "<td><table>"
							columns++;
						}
						html += "<tr><td><div class='placeInfo-telephone'>Telephone: " + place.details.formatted_phone_number + "</div></td></tr>";
					}
					if (place.details.rating) {
						if (columns == 0) {
							html += "<td><table>"
							columns++;
						}
						html += "<tr><td><div class='placeInfo-rating'>Rating: " + place.details.rating + "</div></td></tr>";
					}
					if (place.details.url) {
						if (columns == 0) {
							html += "<td><table>"
							columns++;
						}
						html += "<tr><td><div class='placeInfo-url'><a href='" + place.details.url + "'>Google+</a></div></td></tr>";
					}
					if (place.details.website) {
						if (columns == 0) {
							html += "<td><table>"
							columns++;
						}
						html += "<tr><td><div class='placeInfo-website'><a href='" + place.details.website + "'>Website</a></div></td></tr>";
					}

					if (columns > 0) {
						html += "</td></table>"
						columns++;
					}

					html += "</tr></table>";

				} else {
					html += "<div class='placeInfo-crimescore'><span class='placeInfo-crimescore-logo'>CrimeScore</span>" + Math.round(place.crimescore) + "</div>";
					html += "<div class='placeInfo-removeLink'><a href=\"javascript:removeMarker('" + identifierForLatLng(place.latitude, place.longitude) + "')\">Remove from Map</a></div>";
				}

				place.infoWindow = new google.maps.InfoWindow({content: html});
				google.maps.event.addListener(place.marker, 'click', function() {
					place.infoWindow.open(map, place.marker);
				});
			} else {
				delete csPlaces[id];
			}
		}
	}
};

// Generate a system-wide identifier for a lat/lng
var identifierForLatLng = function(latitude, longitude) {
	latitude = latitude.toString();
	latitude = latitude.replace(/-/g, "");
	latitude = latitude.replace(/\./g, "");
	longitude = longitude.toString();
	longitude = longitude.replace(/-/g, "");
	longitude = longitude.replace(/\./g, "");
	return latitude + longitude + "";
}

// Add listener to search box
var addSearchBoxListener = function() {			
	document.getElementById("searchBox").onkeypress = function(e) {
		if (!e) e = window.event;
		if (e.keyCode == '13')
			processSearchBox();
	};
	$("#submitSearch").click(processSearchBox);
};

var processSearchBox = function() {
	// Value of text box
	var address = document.getElementById("searchBox").value;

	var request = {
		// Hardcode location to center of Washington, D.C.
		location: new google.maps.LatLng(38.918819,-77.011808),
		// Text box value
		keyword: address,
		// Radius of 8km
		radius: 9000
	};

	// Send request to service
	service.radarSearch(request, processPlaceSearchResult);
};

var resetAll = function() {
	for (var i = 0; i < detailSearchTimers.length; i++) {
		clearInterval(detailSearchTimers[i]);
	}
	setTimeout(removeMarkers, 1000);
	launchSearch();
};

var processPlaceSearchResult = function(results, status) {
	var i = 0;
	var j = 0;
	while (i < results.length) {
		var toProcess = [];
		for (var k = 0; k < 5; k++) {
			toProcess.push(results[i]);
			i++;
		}

		getPlaceDetailsAfterDelay(toProcess, j * 3000);
		j++;
	}
};

// Get place details after a delay to satisfy Google API access requirements
var getPlaceDetailsAfterDelay = function(results, delay) {
	var timer = setTimeout(function() {
		for (var i = 0; i < results.length; i++) {
			service.getDetails({reference: results[i].reference}, processPlaceDetailSearchResult);
		}
	}, delay);

	detailSearchTimers.push(timer);
};

var processPlaceDetailSearchResult = function(place, status) {
	
	// If Places API is not up and running, just return
	if (status != google.maps.places.PlacesServiceStatus.OK) {
		return;
	}
	
	// Only interested in good places with geometry information
	if (typeof(place) == "object" && place.geometry) {
		var lat = place.geometry.location.lat();
		var lng = place.geometry.location.lng();
		var id = identifierForLatLng(lat, lng);
		
		// Create a new csPlace with coordinates and identifier
		csPlaces[id] = new csPlace(lat, lng);
		csPlaces[id].details = place;

		// Fire off a request for a CrimeScore for each coordinate
		getCrimeScore(lat, lng);
	}
};