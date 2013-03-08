/**
* Google heatmap layer (This is not FusionTableLayer, although the underlying data can be retrieved from fusiontable.) 
* Loads and displays encoded polygon shapes in JSON (JavaScript Object Notation).
* By Shipeng Sun, GLI at IonE, UMN.
*/

goog.provide("monsoon.maps.GHeatmapLayer");
 
// Initialize the layer with Google maps object
/**
 * @constructor
*/
monsoon.maps.GHeatmapLayer = function(GmapObj) {
	this.map = GmapObj;
};

monsoon.maps.GHeatmapLayer.prototype.map = null;
monsoon.maps.GHeatmapLayer.prototype.GLayer = null;
monsoon.maps.GHeatmapLayer.prototype.dataURL = null; // fusion table RUL
monsoon.maps.GHeatmapLayer.prototype.queryStatement = null;
monsoon.maps.GHeatmapLayer.prototype.colors = null;

// Shared map layer properties
monsoon.maps.GHeatmapLayer.prototype.minZoom = 0;
monsoon.maps.GHeatmapLayer.prototype.maxZoom = 6;
monsoon.maps.GHeatmapLayer.prototype.visible = false;
monsoon.maps.GHeatmapLayer.prototype.layerIndex = 0; // the index of the layer in the overlayMapTypes array
monsoon.maps.GHeatmapLayer.prototype.layerName = "Heatmap Layer";
monsoon.maps.GHeatmapLayer.prototype.layerType = "Density";

// Clears all shapes from the map.
monsoon.maps.GHeatmapLayer.prototype.clearLayer = function() {
	if (this.GLayer) {
		this.GLayer.setData(null);
		this.GLayer = null;
	}
};

// Clears all shapes from the map.
monsoon.maps.GHeatmapLayer.prototype.showLayer = function() {
	if (this.GLayer) {
		this.GLayer.setMap(this.map);	
	}
	
	this.visible = true;
};

// Clears all shapes from the map.
monsoon.maps.GHeatmapLayer.prototype.hideLayer = function() {

	if(this.GLayer) {
		this.GLayer.setMap(null);			
	}

	this.visible = false;
};


monsoon.maps.GHeatmapLayer.prototype.onTilesLoaded = function() {
};


// Loads a new polygon set into the map.
monsoon.maps.GHeatmapLayer.prototype.loadLayer = function(encodedQuery) {
	var self = this;
	this.clearLayer();

	this.GLayer = new google.maps.visualization.HeatmapLayer();
	//this.GLayer.setMap(this.map);
	var layerObj = this.GLayer;
	var heatmapColors = this.colors;
	var mapObj = this.map;
	
   // Construct the URL
   var url = ['https://www.googleapis.com/fusiontables/v1/query'];
   url.push('?sql=' + encodedQuery);
   url.push('&key=AIzaSyBMG7x1OzhY3R4gHMuQgKs07T0RsPNeLTY');
   url.push('&fields=rows');
   url.push('&callback=?');

   // Send the JSONP request using jQuery
   $.ajax({
    url: url.join(''),
    dataType: 'jsonp',
    context: this,
    success: function (data) {
			var rows = data['rows'];
			var heatMapData = new Array();
			for (var i in rows) {
        		var locStr = rows[i][0];
        		var totalP = rows[i][1];
        		totalP = 1.0 + (totalP - 71290.0)/(394040-71290)*(128.0);
				var latlng = locStr.split(',');
	  			heatMapData.push({location: new google.maps.LatLng(latlng[0],latlng[1]),
						weight: totalP});
	  		}

	  		layerObj.setData(heatMapData);
	  		layerObj.setOptions({dissipating: false, gradient: heatmapColors, radius: 0.7});
	  		//layerObj.setMap(mapObj);
	  	}
	  });
};