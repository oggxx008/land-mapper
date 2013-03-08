/**
* Google Polygon (Marker) Map
* Loads and displays encoded polygon shapes in JSON (JavaScript Object Notation).
* By Shipeng Sun, GLI at IonE, UMN.
*/

goog.provide("monsoon.maps.PolygonLayer");
 
// Initialize the layer with Google maps object
/**
 * @constructor
*/
monsoon.maps.PolygonLayer = function(GmapObj) {
	this.map = GmapObj;
};

monsoon.maps.PolygonLayer.prototype.map = null;
monsoon.maps.PolygonLayer.prototype.mapData = null;
monsoon.maps.PolygonLayer.prototype.tooltip = null;

// Shared map layer properties
monsoon.maps.PolygonLayer.prototype.minZoom = 0;
monsoon.maps.PolygonLayer.prototype.maxZoom = 6;
monsoon.maps.PolygonLayer.prototype.visible = false;
monsoon.maps.PolygonLayer.prototype.layerIndex = 0; // the index of the layer in the overlayMapTypes array
monsoon.maps.PolygonLayer.prototype.layerName = "Vector Layer";
monsoon.maps.PolygonLayer.prototype.layerType = "Vector";

// Gets a color for a specific value.
monsoon.maps.PolygonLayer.prototype.getColorForValue = function(value) {
	if (!isNaN(parseFloat(value)) && isFinite(value)) {
		if (value <= 20) {
		return "#aed0da";
	} else if (value <= 40) {
		return "#68c2e7";
	} else if (value <= 60) {
		return "#00a9df";
	} else if (value <= 80) {
		return "#00719f";
	} else if (value <= 100) {
		return "#003060";
	}
	}
	return "#ccc";
};

// Re-renders the map display.
monsoon.maps.PolygonLayer.prototype.renderLayer = function() {
	if (this.mapData) {
		var geo, i;
	
		for (i in this.mapData) {
			if (this.mapData.hasOwnProperty(i)) {
				geo = this.mapData[i];
				geo.value = Math.round(100*Math.random()); // << Reassign value. Pull this number for your data source.
				geo.enabled = (geo.value > -1);
				geo.shape.setOptions({
					fillColor: this.getColorForValue( geo.value ),
					fillOpacity: (geo.enabled ? 0.75 : 0),
					clickable: geo.enabled
				});
			}
		}
	
	}
};

// Adds a polygon to the map instance.
monsoon.maps.PolygonLayer.prototype.addPolygon = function(geo) {
	var self = this, i;

	// Decode polygon data, replacing encoded data with decoded data.
	for (i=geo.shape.length-1; i >= 0; i--) {
		geo.shape[i] = google.maps.geometry.encoding.decodePath(geo.shape[i]);
	}

	// Create new map polygon.
	geo.shape = new google.maps.Polygon({
		paths: geo.shape,
		zoomFactor: 1,
		numLevels: 5,
		strokeColor: "#FFFFFF",
		strokeOpacity: 1.0,
		strokeWeight: 0.1,
		fillColor: this.getColorForValue( geo.value ),
		fillOpacity: 0.5,
		visible: this.visible
	});

	if (this.tooltip) {
		// Attach MouseOver behavior.
		google.maps.event.addListener(geo.shape, 'mouseover', function() {
			if (geo.enabled) {
				self.tooltip.show( '<h4>'+ geo.label +'</h4><p>Value: '+ geo.value +'</p>' );
			}
		});

		// Attach MouseOut behavior.
		google.maps.event.addListener(geo.shape, 'mouseout', function() {
			self.tooltip.hide();
		});
	}

	// Attach polygon to map.
	geo.shape.setMap(this.map);
};

// Clears all shapes from the map.
monsoon.maps.PolygonLayer.prototype.clearLayer = function() {
	var geo;
	if (this.mapData) {
		while (this.mapData.length > 0) {
			geo = this.mapData.pop();
			geo.shape.unbindAll();
			geo.shape.setMap(null);
			geo.shape = null;
			geo = null;
		}
		this.mapData = null;
	}
};

// Clears all shapes from the map.
monsoon.maps.PolygonLayer.prototype.showLayer = function() {
	if (this.mapData) {
		this.visible = true;
		var geo, i;
	
		for (i in this.mapData) {
			if (this.mapData.hasOwnProperty(i)) {
				geo = this.mapData[i];
				geo.shape.setVisible(true);
			}
		}
	
	}
};

// Clears all shapes from the map.
monsoon.maps.PolygonLayer.prototype.hideLayer = function() {
	if (this.mapData) {
		var geo, i;
		this.visible = false;
		for (i in this.mapData) {
			if (this.mapData.hasOwnProperty(i)) {
				geo = this.mapData[i];
				geo.shape.setVisible(false);
			}
		}
	
	}
};


monsoon.maps.PolygonLayer.prototype.onTilesLoaded = function() {
};


// Loads a new polygon set into the map.
monsoon.maps.PolygonLayer.prototype.loadLayer = function(url) {
	var self = this;
	this.clearLayer();

	// No cross-domain rules, this would not be able to get data from another website.		
	$.ajax({
		url: url,
		dataType: 'json',
		crossDomain: true,
		success: function(data) {

			var geo,i;
			//console.log(data.length);
			for (i=data.length-1; i >= 0; i--) {
				geo = data[i];
				geo.value = Math.round(100*Math.random()); // << Assign a value. Pull this number for your data source.
				geo.enabled = true;
				self.addPolygon(geo);
			}

			self.mapData = data;
			self = null;
		}
	});
};