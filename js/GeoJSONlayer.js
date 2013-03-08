/**
* Google Vector Map
* Loads and displays tiled images.
* By Shipeng Sun, GLI IonE, UMN.
*/
/*
* TODO: 
* 1. Simply the map (provinces and states).
* 2. Generate PolyLines to show the boundary.
* 3. Combine Parts in different tiles (use a map with ID as key and GoogeMapObject as values).
* 4. Optimize the memeory use and efficiency with tileLoaded event (overlayMapTypes are included).
*			the layer control should fire tileLoaded event handler in each of those overlayMapTypes.
*/

goog.provide("monsoon.maps.TiledVectorMap");

goog.require("goog.structs.LinkedMap");
goog.require("goog.structs.StringSet");

/**
 * @constructor
*/
monsoon.maps.TiledVectorMap = function(GmapObj, tileSize) {
	this.map = GmapObj;
	this.tileSize = tileSize;
	this.mapCacheSize = Math.ceil($("map_canvas").height()/tileSize.y * $("map_canvas").width()/tile.x);
	console.log("Cache Size:" + this.mapCacheSize);
	
	this.mapDataSet = new goog.structs.LinkedMap(this.mapCacheSize, true); // if there are more than 400 nodes, extra nodes will be removed from the tail.
	this.tileRequestSet  = new goog.structs.StringSet();
	this.latestZoom = this.map.getZoom();
};

/**
 * @constructor
*/
monsoon.maps.TiledVectorMap = function(GmapObj, tileSize, cacheSize) {
	this.map = GmapObj;
	this.tileSize = tileSize;
	this.mapDataSet = new goog.structs.LinkedMap(cacheSize, true); // if there are more than 400 nodes, extra nodes will be removed from the tail.
	this.mapCacheSize = cacheSize;
	this.tileRequestSet  = new goog.structs.StringSet();
	this.latestZoom = this.map.getZoom();
};

/*
The complete prototype stle class/object definition with attributes and methods. 
*/
monsoon.maps.TiledVectorMap.prototype.map = null; // the google map object that images will be attached to.
monsoon.maps.TiledVectorMap.prototype.baseURL = "http://sunsp.net/download/maptiles"; // image tiles address
monsoon.maps.TiledVectorMap.prototype.tileSize = null;

monsoon.maps.TiledVectorMap.prototype.tooltip = null;


monsoon.maps.TiledVectorMap.prototype.mapDataSet = null; // a linked map structure, with zoom-tileX-tileY as key and featureCollection as value.
monsoon.maps.TiledVectorMap.prototype.mapCacheSize = 400;

monsoon.maps.TiledVectorMap.prototype.tileRequestSet = null;
monsoon.maps.TiledVectorMap.prototype.latestZoom = -1;

// Shared map layer properties
monsoon.maps.TiledVectorMap.prototype.minZoom = 0;
monsoon.maps.TiledVectorMap.prototype.maxZoom = 8;
monsoon.maps.TiledVectorMap.prototype.visible = false;
monsoon.maps.TiledVectorMap.prototype.layerIndex = 0; // the index of the layer in the overlayMapTypes array
monsoon.maps.TiledVectorMap.prototype.layerName = "Tiled Vector Layer";
monsoon.maps.TiledVectorMap.prototype.layerType = 'TiledVector';


// TODO: generate map tiles at levels 0, 4, 7, and 10
monsoon.maps.TiledVectorMap.prototype.remapTile = function (zoom, x, y) {
	// 0, 1, 2, 3, 4 --> 0 country level; 5, 6, 7 --> 5 state level; 8, 9, 10 --> 8 county level, 11, 11, 12 --> 11
	var mX, mY;
	if(zoom <= 4) {
		return { zoom: 0, x: 0, y: 0 };
	} else if(zoom <= 7) {
		mX = 1 << (zoom - 5);
		mY = Math.floor(y/mX);
		mX = Math.floor(x/mX);
		return { zoom: 5, x: mX, y: mY };
	} else if(zoom <= 19) {
		mX = 1 << (zoom - 8);
		mY = Math.floor(y/mX);
		mX = Math.floor(x/mX);
		return { zoom: 8, x: mX, y: mY };
	} else if(zoom <= 12) {
		mX = 1 << (zoom - 11);
		mY = Math.floor(y/mX);
		mX = Math.floor(x/mX);
		return { zoom: 11, x: mX, y: mY };
	} else {
		mX = 1 << (zoom - 11);
		mY = Math.floor(y/mX);
		mX = Math.floor(x/mX);
		return { zoom: 11, x: mX, y: mY };
	}
}

// getTile required by the Google Maps API to load images at a particular tile
// coord is the tile coordinates, not geographic coordinates.
monsoon.maps.TiledVectorMap.prototype.getTile = function(coord, zoom, ownerDocument) {
	if(zoom < this.minZoom || zoom > this.maxZoom) {
		this.clearLayer();
		this.latestZoom = -1;
		return null;
	}
	
	var tileIndex = monsoon.maps.TiledVectorMap.prototype.normalizCoord(coord, zoom);
	if (!tileIndex) {
	  return ownerDocument.createElement('div');
	}
 
	var remappedTileIndex = monsoon.maps.TiledVectorMap.prototype.remapTile(zoom, tileIndex.x, tileIndex.y);
	
	if(this.latestZoom != remappedTileIndex.zoom) {
		this.latestZoom = remappedTileIndex.zoom;
		//this.hideLayer();
		this.clearLayer();
	}
	// Check if we have already had the data for this tile.
	var keyStr = remappedTileIndex.zoom + "_" + remappedTileIndex.x + "_" + remappedTileIndex.y;
	var div = ownerDocument.createElement('div');
	//div.innerHTML = keyStr;
	//div.style.width = this.tileSize.width + 'px';
	//div.style.height = this.tileSize.height + 'px';
	//div.style.borderStyle = 'solid';
	//div.style.borderWidth = '1px';
	
	if(this.mapDataSet.containsKey(keyStr)) {
		this.mapDataSet.get(keyStr, null); // move this node up
		return div;
	} else {
		var geoJSONURL = this.baseURL + remappedTileIndex.zoom + "/" + remappedTileIndex.x + "/" + remappedTileIndex.y + ".json";
		
		if(this.tileRequestSet.contains(keyStr)) {
			return div; // Others had requested it. Do not need do it again.
		} else {
			this.tileRequestSet.add(keyStr);
		}

		this.loadGeoJSON(geoJSONURL, keyStr, {
			map: this.map,
			strokeColor: "#880000",
			strokeOpacity: 0.5,
			strokeWeight: 0.6,
			fillColor: "#FFFFFF",
			fillOpacity: 0.3,
			visible: this.visible,
			zIndex: zoom + 10
		});	

		return div;
   }
};
      
monsoon.maps.TiledVectorMap.prototype.normalizCoord = function(coord, zoom) {

	var y = coord.y;
	var x = coord.x;

	// tile range in one direction range is dependent on zoom level
	// 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
	var tileRange = 1 << zoom;

	// don't repeat across y-axis (vertically)
	if (y < 0 || y >= tileRange) {
	return null;
	}

	// repeat across x-axis
	if (x < 0 || x >= tileRange) {
	x = (x % tileRange + tileRange) % tileRange;
	}

	return {
	x: x,
	y: y
	};

};

// Loads a new polygon set into the map.
monsoon.maps.TiledVectorMap.prototype.loadLayer = function() {
	var self = this;
	this.map.overlayMapTypes.setAt(this.layerIndex, self);
};
	
// Clears all shapes from the map.
monsoon.maps.TiledVectorMap.prototype.clearLayer = function() {
	
	var visNow = this.visible;
	this.hideLayer();
	this.visible = visNow;
	
	if(this.mapDataSet) {
		this.mapDataSet.clear();
	}
	if(this.tileRequestSet) {
		this.tileRequestSet.clear();
	}
};


monsoon.maps.TiledVectorMap.prototype.onTilesLoaded = function() {
/*	
	if(this.visible) {
		this.showLayer();
	}
	*/
};



// Gets a color for a specific value.
monsoon.maps.TiledVectorMap.prototype.getColorForValue = function(value) {
	if (!isNaN(parseFloat(value)) && isFinite(value)) {
		if (value <= 3) {
		return "#aed0da";
 	} else if (value <= 5) {
		return "#68c2e7";
	} else if (value <= 7) {
		return "#00a9df";
	} else if (value <= 9) {
		return "#00719f";
	} else if (value <= 100) {
		return "#003060";
	}
	}
	return "#ccc";
};

monsoon.maps.TiledVectorMap.prototype.showGeogFeature = function (obj, toShow) {
	if(!obj) return;
	
	if($.isArray(obj)) {
		var i = 0;
		for(i = 0; i < obj.length; i++) {
			monsoon.maps.TiledVectorMap.prototype.showGeogFeature(obj[i], toShow);
		}
	} else
	{
		obj.setOptions({
					fillColor: this.getColorForValue( obj.get("geojsonProperties").C ),
					fillOpacity: 0.75,
					clickable: true,
					strokeOpacity: 0.3
				});		
		obj.setVisible(toShow);
	}
};

// Show the map
monsoon.maps.TiledVectorMap.prototype.showLayer = function() {
	var self = this;
	var zoomNum = this.map.getZoom();
	var remappedZoom = monsoon.maps.TiledVectorMap.prototype.remapTile(zoomNum, 0, 0);
	var reZoom = remappedZoom.zoom;
	
	// going through the mapDataSet and turn on all markers at the current zoom level
	if(this.mapDataSet) {
		var allTileDataKeys = this.mapDataSet.getKeys();
		var allTileDataVals = this.mapDataSet.getValues();
		var i = 0;
		var tileFeatureKey = null;
		var tileFeatureDat = null;
		for(i = 0; i < allTileDataKeys.length; i++)
		{
			tileFeatureKey = allTileDataKeys[i];
			tileFeatureDat = allTileDataVals[i]
			
			if(tileFeatureKey.indexOf(reZoom + "") === 0) {
				// this is the right zoom level, show it
				monsoon.maps.TiledVectorMap.prototype.showGeogFeature(tileFeatureDat, true);
			} else {
				// this could be a Google marker/polyline/polygon or an array of them or a array of array of them
				monsoon.maps.TiledVectorMap.prototype.showGeogFeature(tileFeatureDat, false);
			}
		}
	}	
	this.visible = true;
};

// hide the map
monsoon.maps.TiledVectorMap.prototype.hideLayer = function() {
	// remove the layer from the overlayMapTypes array
	//this.map.overlayMapTypes.removeAt(this.layerIndex);
	var self = this;
	//this.map.overlayMapTypes.setAt(self.layerIndex, null);
	
	// going through the mapDataSet and turn off all markers
	if(this.mapDataSet) {
		var allTileData = this.mapDataSet.getValues();
		var i = 0;
		var tileFeatureDat = null;
		for(i =0; i < allTileData.length; i++)
		{
			tileFeatureDat = allTileData[i];// this could be a Google marker/polyline/polygon or an array of them or a array of array of them
			monsoon.maps.TiledVectorMap.prototype.showGeogFeature(tileFeatureDat, false);
		}
	}		
	this.visible = false;
};

// referesh the map
monsoon.maps.TiledVectorMap.prototype.refreshLayer = function() {
	// nothing to do	
};	

monsoon.maps.TiledVectorMap.prototype.loadGeoJSON = function (url, key, displayOptions) {
	var self = this;
	//this.clearLayer();
	//console.log(url + " : " + key);

	// No cross-domain rules, this would not be able to get data from another website.		
	$.ajax({
		url: url,
		dataType: 'json',
		crossDomain: true,
		async: true,
		success: function(data) {
			//console.log(data.type);
			var tileDat = self.addFeature(data, displayOptions);

			if(self.mapDataSet.getCount() === this.mapCacheSize) {
				// the last one will be removed, but hide it before deleting from our control
				monsoon.maps.TiledVectorMap.prototype.showGeogFeature(self.mapDataSet.peekLast(), false);
				this.tileRequestSet.remove(keyStr);
			}
			
			self.mapDataSet.set(key, tileDat);
			self = null;
		},
		error: function (xhr, txtStatus, thrownError) {
			console.log(xhr.status + ":" + thrownError + ":" + txtStatus);
			//console.log(xhr.responseText);
		}
	});	
};

monsoon.maps.TiledVectorMap.prototype.addFeature = function (geojson, options) {
	var self = this;
	//var GObj = null;	
	//var objProp = null;
	var obj;
	var opts = options || {};
	
	switch ( geojson.type ){
	
		case "FeatureCollection":
			if (!geojson.features){
				obj = monsoon.maps.TiledVectorMap.prototype.error("Invalid GeoJSON object: FeatureCollection object missing \"features\" member.");
			}else{
				obj = [];
				for (var i = 0; i < geojson.features.length; i++){
					//obj.push(monsoon.maps.TiledVectorMap.prototype.geometryToGoogleMaps(geojson.features[i].geometry, opts, geojson.features[i].properties));
					obj.push(self.geometryToGoogleMaps(geojson.features[i].geometry, opts, geojson.features[i].properties));
				}

			}
			break;
		
		case "GeometryCollection":
			if (!geojson.geometries){
				obj = monsoon.maps.TiledVectorMap.prototype.error("Invalid GeoJSON object: GeometryCollection object missing \"geometries\" member.");
			}else{
				obj = [];
				for (var i = 0; i < geojson.geometries.length; i++){
					var GObj = monsoon.maps.TiledVectorMap.prototype.geometryToGoogleMaps(geojson.geometries[i], opts);
					obj.push(GObj);
				}
			}
			break;
		
		case "Feature":
			if (!( geojson.properties && geojson.geometry )){
				obj = monsoon.maps.TiledVectorMap.prototype.error("Invalid GeoJSON object: Feature object missing \"properties\" or \"geometry\" member.");
			}else{
				obj = monsoon.maps.TiledVectorMap.prototype.geometryToGoogleMaps(geojson.geometry, opts, geojson.properties);
			}
			break;
		
		case "Point": case "MultiPoint": case "LineString": case "MultiLineString": case "Polygon": case "MultiPolygon":
			obj = geojson.coordinates
				? obj = monsoon.maps.TiledVectorMap.prototype.geometryToGoogleMaps(geojson, opts)
				: monsoon.maps.TiledVectorMap.prototype.error("Invalid GeoJSON object: Geometry object missing \"coordinates\" member.");
			break;
		
		default:
			obj = monsoon.maps.TiledVectorMap.prototype.error("Invalid GeoJSON object: GeoJSON object must be one of \"Point\", \"LineString\", \"Polygon\", \"MultiPolygon\", \"Feature\", \"FeatureCollection\" or \"GeometryCollection\".");
	
	}
	
	return obj;

};

monsoon.maps.TiledVectorMap.prototype.geometryToGoogleMaps = function( geojsonGeometry, opts, geojsonProperties ){
		
		var googleObj;
		
		switch ( geojsonGeometry.type ){
			case "Point":
				opts.position = new google.maps.LatLng(geojsonGeometry.coordinates[1], geojsonGeometry.coordinates[0]);
				googleObj = new google.maps.Marker(opts);
				if (geojsonProperties) {
					googleObj.set("geojsonProperties", geojsonProperties);
				}
				break;
				
			case "MultiPoint":
				googleObj = [];
				for (var i = 0; i < geojsonGeometry.coordinates.length; i++){
					opts.position = new google.maps.LatLng(geojsonGeometry.coordinates[i][1], geojsonGeometry.coordinates[i][0]);
					googleObj.push(new google.maps.Marker(opts));
				}
				if (geojsonProperties) {
					for (var k = 0; k < googleObj.length; k++){
						googleObj[k].set("geojsonProperties", geojsonProperties);
					}
				}
				break;
				
			case "LineString":
				var path = [];
				for (var i = 0; i < geojsonGeometry.coordinates.length; i++){
					var coord = geojsonGeometry.coordinates[i];
					var ll = new google.maps.LatLng(coord[1], coord[0]);
					path.push(ll);
				}
				opts.path = path;
				googleObj = new google.maps.Polyline(opts);
				if (geojsonProperties) {
					googleObj.set("geojsonProperties", geojsonProperties);
				}
				break;
				
			case "MultiLineString":
				googleObj = [];
				for (var i = 0; i < geojsonGeometry.coordinates.length; i++){
					var path = [];
					for (var j = 0; j < geojsonGeometry.coordinates[i].length; j++){
						var coord = geojsonGeometry.coordinates[i][j];
						var ll = new google.maps.LatLng(coord[1], coord[0]);
						path.push(ll);
					}
					opts.path = path;
					googleObj.push(new google.maps.Polyline(opts));
				}
				if (geojsonProperties) {
					for (var k = 0; k < googleObj.length; k++){
						googleObj[k].set("geojsonProperties", geojsonProperties);
					}
				}
				break;
				
			case "Polygon":
				var paths = [];
				var exteriorDirection;
				var interiorDirection;
				for (var i = 0; i < geojsonGeometry.coordinates.length; i++){
					var path = [];
					for (var j = 0; j < geojsonGeometry.coordinates[i].length; j++){
						var ll = new google.maps.LatLng(geojsonGeometry.coordinates[i][j][1], geojsonGeometry.coordinates[i][j][0]);
						path.push(ll);
					}
					if(!i){
						exteriorDirection = monsoon.maps.TiledVectorMap.prototype.ccw(path);
						paths.push(path);
					}else if(i == 1){
						interiorDirection = monsoon.maps.TiledVectorMap.prototype.ccw(path);
						if(exteriorDirection == interiorDirection){
							paths.push(path.reverse());
						}else{
							paths.push(path);
						}
					}else{
						if(exteriorDirection == interiorDirection){
							paths.push(path.reverse());
						}else{
							paths.push(path);
						}
					}
				}
				
				opts.paths = paths;
				opts.fillColor = this.getColorForValue(geojsonProperties.C);
				googleObj = new google.maps.Polygon(opts);
								
				if (geojsonProperties) {
					googleObj.set("geojsonProperties", geojsonProperties);
				}
				
				var self = this;
				// Attach MouseOver behavior.
				google.maps.event.addListener(googleObj, 'mouseover', function() {
					if(geojsonProperties.SOVEREIGNT) {
						self.tooltip.show( '<h4>'+ geojsonProperties.SOVEREIGNT +'</h4><p>Population: '+ geojsonProperties.POP_EST +'</p><p>GDP EST: '+ geojsonProperties.GDP_MD_EST);
					} else if(geojsonProperties.N && geojsonProperties.M){
						self.tooltip.show( '<h4>'+ geojsonProperties.N +'</h4><p>Country/Territory: '+ geojsonProperties.N +'</p>' +  '<p>Province/State   : '+ geojsonProperties.M +'</p>');
					}
				});
		
				// Attach MouseOut behavior.
				google.maps.event.addListener(googleObj, 'mouseout', function() {
					self.tooltip.hide();
				});										
			
				
				break;
				
			case "MultiPolygon":
				googleObj = [];
				for (var i = 0; i < geojsonGeometry.coordinates.length; i++){
					var paths = [];
					var exteriorDirection;
					var interiorDirection;
					for (var j = 0; j < geojsonGeometry.coordinates[i].length; j++){
						var path = [];
						for (var k = 0; k < geojsonGeometry.coordinates[i][j].length; k++){
							var ll = new google.maps.LatLng(geojsonGeometry.coordinates[i][j][k][1], geojsonGeometry.coordinates[i][j][k][0]);
							path.push(ll);
						}
						if(!j){
							exteriorDirection = monsoon.maps.TiledVectorMap.prototype.ccw(path);
							paths.push(path);
						}else if(j == 1){
							interiorDirection = monsoon.maps.TiledVectorMap.prototype.ccw(path);
							if(exteriorDirection == interiorDirection){
								paths.push(path.reverse());
							}else{
								paths.push(path);
							}
						}else{
							if(exteriorDirection == interiorDirection){
								paths.push(path.reverse());
							}else{
								paths.push(path);
							}
						}
					}
					opts.paths = paths;

					if (geojsonProperties) {
						opts.fillColor = this.getColorForValue(geojsonProperties.C);
					}	
					
					googleObj.push(new google.maps.Polygon(opts));
				}
				
				if (geojsonProperties) {
					
					for (var k = 0; k < googleObj.length; k++){
						googleObj[k].set("geojsonProperties", geojsonProperties);

						var self = this;
						// Attach MouseOver behavior.
						google.maps.event.addListener(googleObj[k], 'mouseover', function() {
							if(geojsonProperties.SOVEREIGNT) {
								self.tooltip.show( '<h4>'+ geojsonProperties.SOVEREIGNT +'</h4><p>Population: '+ geojsonProperties.POP_EST +'</p><p>GDP EST: '+ geojsonProperties.GDP_MD_EST);
							} else if(geojsonProperties.N && geojsonProperties.M){
								self.tooltip.show( '<h4>'+ geojsonProperties.N +'</h4><p>Country/Territory: '+ geojsonProperties.N +'</p>' +  '<p>Province/State   : '+ geojsonProperties.M +'</p>');
							}
						});
				
						// Attach MouseOut behavior.
						google.maps.event.addListener(googleObj[k], 'mouseout', function() {
							self.tooltip.hide();
						});										
					

					}
				}
				break;
				
			case "GeometryCollection":
				googleObj = [];
				if (!geojsonGeometry.geometries){
					googleObj = monsoon.maps.TiledVectorMap.prototype.error("Invalid GeoJSON object: GeometryCollection object missing \"geometries\" member.");
				}else{
					for (var i = 0; i < geojsonGeometry.geometries.length; i++){
						googleObj.push(monsoon.maps.TiledVectorMap.prototype.geometryToGoogleMaps(geojsonGeometry.geometries[i], opts, geojsonProperties || null));
					}
				}
				break;
				
			default:
				googleObj = monsoon.maps.TiledVectorMap.prototype.error("Invalid GeoJSON object: Geometry object must be one of \"Point\", \"LineString\", \"Polygon\" or \"MultiPolygon\".");
		}
		
		return googleObj;
		
};

	
monsoon.maps.TiledVectorMap.prototype.error = function( message ){
	
		return {
			type: "Error",
			message: message
		};
	
};

monsoon.maps.TiledVectorMap.prototype.ccw = function( path ) {
		var isCCW;
		var a = 0;
		for (var i = 0; i < path.length-2; i++){
			a += ((path[i+1].lat() - path[i].lat()) * (path[i+2].lng() - path[i].lng()) - (path[i+2].lat() - path[i].lat()) * (path[i+1].lng() - path[i].lng()));
		}
		if(a > 0){
			isCCW = true;
		}
		else{
			isCCW = false;
		}
		return isCCW;
};
		

