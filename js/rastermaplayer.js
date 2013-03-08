/**
* Google Image/Raster Map
* Loads and displays tiled images.
* By Shipeng Sun, GLI IonE, UMN.
*/

goog.provide("monsoon.maps.TiledRasterMap");


/**
 * @constructor
*/
monsoon.maps.TiledRasterMap = function(GmapObj, tileSize) {
	this.map = GmapObj;
	this.tileSize = tileSize;
};


/*
The complete prototype stle class/object definition with attributes and methods. 
*/
monsoon.maps.TiledRasterMap.prototype.map = null; // the google map object that images will be attached to.
monsoon.maps.TiledRasterMap.prototype.baseURL = "http://sunsp.net/download/maptiles"; // image tiles address
monsoon.maps.TiledRasterMap.prototype.legendSrc = "legend.png"; // image tiles address + legendSrc = full URL of a legend figure
monsoon.maps.TiledRasterMap.prototype.tileSize = null;

// Shared map layer properties
monsoon.maps.TiledRasterMap.prototype.minZoom = 0;
monsoon.maps.TiledRasterMap.prototype.maxZoom = 6;
monsoon.maps.TiledRasterMap.prototype.visible = false;
monsoon.maps.TiledRasterMap.prototype.layerIndex = 0; // the index of the layer in the overlayMapTypes array
monsoon.maps.TiledRasterMap.prototype.layerName = "Image Layer";
monsoon.maps.TiledRasterMap.prototype.layerType = 'Raster';

// getTile required by the Google Maps API to load images at a particular tile
// coord is the tile coordinates, not geographic coordinates.
monsoon.maps.TiledRasterMap.prototype.getTile = function(coord, zoom, ownerDocument) {
	
	var div = ownerDocument.createElement('div');
	div.style.width = this.tileSize.width + 'px';
	div.style.height = this.tileSize.height + 'px';
	//div.style.borderStyle = 'solid';
	div.style.borderWidth = '0px';
	//div.style.borderColor = '#AAAAAA';

	if(zoom < this.minZoom || zoom > this.maxZoom) {
		return div;
	}
	
	var tileIndex = monsoon.maps.TiledRasterMap.prototype.normalizCoord(coord, zoom);
	var bound = Math.pow(2, zoom);
	if (tileIndex) {
		div.innerHTML = "<img src=\"" + this.baseURL + "/" + zoom + "/" + tileIndex.x + "/" + (bound -1 - tileIndex.y) + ".png" + "\"" + ">";        
	} 
	return div;
};
      
monsoon.maps.TiledRasterMap.prototype.normalizCoord = function(coord, zoom) {
		
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
monsoon.maps.TiledRasterMap.prototype.loadLayer = function() {
		// nothing to load
};
	
// Clears all shapes from the map.
monsoon.maps.TiledRasterMap.prototype.clearLayer = function() {
	// nothing to do.
	// this layer just save an address to tiled images.
};

// Show the map
monsoon.maps.TiledRasterMap.prototype.showLayer = function() {
	var self = this;
	this.clearLayer();
	
	//var vLen = this.map.overlayMapTypes.push(self);
	//this.layerIndex = vLen - 1;
	this.map.overlayMapTypes.setAt(this.layerIndex, self);
	this.visible = true;
};

// hide the map
monsoon.maps.TiledRasterMap.prototype.hideLayer = function() {
	// remove the layer from the overlayMapTypes array
	//this.map.overlayMapTypes.removeAt(this.layerIndex);
	var self = this;
	this.map.overlayMapTypes.setAt(self.layerIndex, null);
	this.visible = false;
};


monsoon.maps.TiledRasterMap.prototype.onTilesLoaded = function() {
};

// referesh the map
monsoon.maps.TiledRasterMap.prototype.refreshLayer = function() {
	// nothing to do	
};	
