/**
* Google Polyline (Marker) Map
* Loads and displays encoded polygon shapes in JSON (JavaScript Object Notation).
* By Shipeng Sun, GLI at IonE, UMN.
*/

goog.provide("monsoon.maps.GeoRegionMap");
goog.require("goog.structs.LinkedMap");
goog.require('monsoon.maps.Util');

 
/**
 * Initialize the layer with Google maps object. 
 * To support animation or slider or any other selector, there is an array of multiple regional maps for this object.
 * @constructor
*/
monsoon.maps.GeoRegionMap = function(GmapObj) {
	this.map = GmapObj;
	this.regionImagesVector = new Array();
};

monsoon.maps.GeoRegionMap.prototype.map = null;
monsoon.maps.GeoRegionMap.prototype.curRegionName = null;

monsoon.maps.GeoRegionMap.prototype.regionImagesVector = null;
monsoon.maps.GeoRegionMap.prototype.curImageIndex = 0; // current active image 

monsoon.maps.GeoRegionMap.prototype.regionsInfo = null;

// Shared map layer properties
monsoon.maps.GeoRegionMap.prototype.minZoom = 0;
monsoon.maps.GeoRegionMap.prototype.maxZoom = 4;
monsoon.maps.GeoRegionMap.prototype.visible = false;
monsoon.maps.GeoRegionMap.prototype.layerIndex = 0; // the index of the layer in the overlayMapTypes array
monsoon.maps.GeoRegionMap.prototype.layerName = "Yield Gap Modeled";
monsoon.maps.GeoRegionMap.prototype.layerType = "GroundView";

monsoon.maps.GeoRegionMap.prototype.loadGeogAdminList = function (adminList) {
	// adminList is a JSON object with a list of {C, N, X, Y, Z}
	// Use this to build a LinkedMap with name as key
	this.regionsInfo = new goog.structs.LinkedMap(200, true);
	
	if(adminList.type == 'countryCollection') {
		var cntryList = adminList.countries;
		var currentIndex = 0;
		for(var i = 0; i < cntryList.length; i++) {
			this.regionsInfo.set(cntryList[i].C, cntryList[i]); // indexed by SU_A3 code
		}
	}
}

// Adds a geo-link to the map instance.
monsoon.maps.GeoRegionMap.prototype.addRegionMap = function(regionInfo, imgFileName) {
	var self = this;
	// Create the bounds to display the image file
	var bounds = new google.maps.LatLngBounds(new google.maps.LatLng(regionInfo.YN, regionInfo.XN),new google.maps.LatLng(regionInfo.YX, regionInfo.XX));

	var groundViewObj = new google.maps.GroundOverlay(imgFileName, bounds);
	groundViewObj.setMap(this.map);
	groundViewObj.setOpacity(0);
	
	if(this.regionImagesVector) {
		this.regionImagesVector.push(groundViewObj);	
	} else {
		this.regionImagesVector = new Array();	
		this.regionImagesVector.push(groundViewObj);	
	}
};

// Clears all shapes from the map.
monsoon.maps.GeoRegionMap.prototype.clearLayer = function() {
	var geoImage;
	if (this.regionImagesVector) {
		while (this.regionImagesVector.length > 0) {
			geoImage = this.regionImagesVector.pop();
			geoImage.setMap(null);
			geoImage = null;
		}
		this.regionImagesVector.length = 0;
		this.regionImagesVector = null;
	}
};

// Clears all shapes from the map.
monsoon.maps.GeoRegionMap.prototype.showLayer = function() {
	var geoImage;
	if (this.regionImagesVector) {
		this.visible = true;
		// Turn the layer on first, then turn others off
		geoImage = this.regionImagesVector[this.curImageIndex];
		if(geoImage) {
			//geoImage.setMap(this.map);
			geoImage.setOpacity(1.0);
		}
		
		for(var i = 0; i < this.regionImagesVector.length; i++) {
			geoImage = this.regionImagesVector[i];
			if(i != this.curImageIndex) {
				//geoImage.setMap(null);
				geoImage.setOpacity(0.0);
			}
		}
	}
};

// Hide the maps
monsoon.maps.GeoRegionMap.prototype.hideLayer = function() {
	var geoImage;
	if (this.regionImagesVector) {
		this.visible = false;
		for(var i = 0; i < this.regionImagesVector.length; i++) {
			geoImage = this.regionImagesVector[i];
			//geoImage.setMap(null);
			geoImage.setOpacity(0);
		}
	}
};

monsoon.maps.GeoRegionMap.prototype.updateImage = function(imgIndex) {

	if(imgIndex >=0 && imgIndex < this.regionImagesVector.length) {
		this.curImageIndex = imgIndex;	
		if(this.visible) {
			var geoImage;
			if (this.regionImagesVector) {
				// Turn the layer on first, then turn others off
				geoImage = this.regionImagesVector[this.curImageIndex];
				if(geoImage) {
					geoImage.setOpacity(1.0);
				}
				
				for(var i = 0; i < this.regionImagesVector.length; i++) {
					geoImage = this.regionImagesVector[i];
					if(i != this.curImageIndex) {
						geoImage.setOpacity(0.0);
					}
				}
			}
		}
	}
}

// Load the trade data from a specific region
monsoon.maps.GeoRegionMap.prototype.loadRegionImages = function(regionName, imageBasePath, imageNames) {
	this.clearLayer();
	
	if(this.regionsInfo.containsKey(regionName)) {
		this.curRegionName = regionName;
		var regionData = this.regionsInfo.get(regionName);
		
		if(imageNames) { // load the data only if it does not exist in the memory
			for(var i = 0 ; i < imageNames.length; i++) {
				this.addRegionMap(regionData, imageBasePath + imageNames[i]);			
			}		
		}		
	}
};


monsoon.maps.GeoRegionMap.prototype.onTilesLoaded = function() {
}
