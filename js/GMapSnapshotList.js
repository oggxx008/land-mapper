/**
* This represents a list of GMapSnapshot that will be shown on a carousel
* Add an instance of this class to the maps.js. Create GMapSnapshot objects from raster layers and add them to * * this list. 
**/


goog.provide('monsoon.maps.GMapSnapshotList');

goog.require('monsoon.maps.GMapSnapshot');
goog.require("monsoon.maps.LayerControl");
goog.require('goog.dom');

/**
* The mapOptions should be inherited from the main map (center, zoom level, etc.)
**/
monsoon.maps.GMapSnapshotList = function () {
	// Save the list of GMapSnapshot objects
	this.snapshotArray = new google.maps.MVCArray();
	
};

monsoon.maps.GMapSnapshotList.prototype.snapshotArray = null;

/**
* Create a new DIV element in the parent list <ul><li></li></ul>
**/
monsoon.maps.GMapSnapshotList.prototype.createDIVforSnapshot = function(parentULName, divID, divTitle) {
	
	var ulElement = goog.dom.getElement(parentULName);
	var liElement = document.createElement('li');
	
	var divPElement = document.createElement('div');
	divPElement.setAttribute('class', 'map_snapshot');

	var divElement = document.createElement('div');
	divElement.setAttribute('class', 'mssdiv');
	divElement.setAttribute('id', divID);
	divElement.setAttribute('title', divTitle);
	
	divElement.innerHTML = '<a href="#"><img src="http://maps.googleapis.com/maps/api/staticmap?center=Niger&zoom=1&size=400x400&maptype=roadmap&sensor=false" width="180" height="180" alt="USA"></a>';

	divPElement.appendChild(divElement);	
	liElement.appendChild(divPElement);
	ulElement.appendChild(liElement);
	
	return divID;
};

monsoon.maps.GMapSnapshotList.prototype.addSnapshot = function (snapshotObj) {
	if(this.snapshotArray) {
		this.snapshotArray.push(snapshotObj);
	}
};

monsoon.maps.GMapSnapshotList.prototype.setMapCenter = function(centerPos) {
	if(this.snapshotArray) {
		var vLen = this.snapshotArray.getLength();
		for(var i = 0; i < vLen; i++)  {
			this.snapshotArray.getAt(i).setCenter(centerPos);
		}
	}
};

monsoon.maps.GMapSnapshotList.prototype.setMapPos = function(centerPos, zoom) {
	if(this.snapshotArray) {
		var vLen = this.snapshotArray.getLength();
		for(var i = 0; i < vLen; i++) {
		//google.maps.event.trigger(this.map_, 'resize');
			this.snapshotArray.getAt(i).setMapPos(centerPos,zoom);
		}
	}
};

monsoon.maps.GMapSnapshotList.prototype.createSnapshotsFromLayerControl = function (layerControlObj) {
	var layersArray = layerControlObj.layerArray;
	var layerObj;
	var ssOptions = { center : layerControlObj.map.getCenter(), 
							zoom: Math.max(1,layerControlObj.map.getZoom() - 2 ),
							disableDoubleClickZoom: true,
							scrollwheel: true };
							
	ssOptions.center = layerControlObj.map.getCenter();
	
	for(var i = 0; i < layersArray.getLength(); i++) {
		layerObj = layersArray.getAt(i);
		
		// if the layer is a raster layer, create a snapshot for it
		if(layerObj.layerType == 'Raster') {
			var snapshotDIVName = 'mss' + layerObj.layerName;
			snapshotDIVName = snapshotDIVName.replace(/\s/g, ''); // remove spaces
			this.createDIVforSnapshot('mapSnapshotList',snapshotDIVName, layerObj.layerName);
			var tmpGSSObj = new monsoon.maps.GMapSnapshot(snapshotDIVName, ssOptions);
			
			tmpGSSObj.attachRasterLayer(layerObj);

			google.maps.event.trigger(tmpGSSObj.map_, 'resize');
			this.addSnapshot(tmpGSSObj);
			tmpGSSObj.addClickEvent(layerControlObj);		
		}
	}
	
	// This must be called, otherwise the carousel will be frozen.
	$( '#jcarousel3').jcarousel('reload');
}
