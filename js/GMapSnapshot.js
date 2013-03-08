/**
* A GMapSnapshot class holding a Google Map object and another layers 
* It is similar to a fully functional map but without all the controls.
**/

goog.provide('monsoon.maps.GMapSnapshot');

goog.require('goog.dom');
goog.require('monsoon.maps.MapTooltip'); // @NL new line

/**
* The mapOptions should be inherited from the main map (center, zoom level, etc.)
**/
monsoon.maps.GMapSnapshot = function (divElementName, mapOptions) {
	this.div_ = divElementName;
	mapOptions.disableDefaultUI = true;
	mapOptions.draggable = false;
	mapOptions.mapTypeId = google.maps.MapTypeId.TERRAIN;
	var divObj = goog.dom.getElement(divElementName);
	divObj.style.display = "block";
	divObj.innerHTML = '';
    var map = new google.maps.Map(divObj, mapOptions);
	this.map_ = map;
	
	this.tooltip_ = new monsoon.maps.MapTooltip(divElementName); // @NL
	this.tooltip_.balloonAlwaysUp = true;
	
	google.maps.event.addListener(this.map_, 'tilesloaded', goog.bind(this.tilesLoaded, this));	
};

monsoon.maps.GMapSnapshot.prototype.map_ = null;
monsoon.maps.GMapSnapshot.prototype.div_ = null;
monsoon.maps.GMapSnapshot.prototype.layerName_ = '';
monsoon.maps.GMapSnapshot.prototype.tooltip_ = null;
monsoon.maps.GMapSnapshot.prototype.rasterLayerObj_ = null;

monsoon.maps.GMapSnapshot.prototype.attachRasterLayer = function(rasterLayerObj) {
	// add the raster layer to the map
	if(this.map_) {
		//this.map_.overlayMapTypes.setAt(0, rasterLayerObj);
		this.map_.overlayMapTypes.push(rasterLayerObj);
		this.layerName_ = rasterLayerObj.layerName;
		this.rasterLayerObj_ = rasterLayerObj;

	var snapShotDiv = goog.dom.getElement(this.div_);
	var layerName = this.layerName_;
	var tipWindow = this.tooltip_;
	var legendURL = rasterLayerObj.baseURL + '/' + rasterLayerObj.legendSrc;
	
    var newImg = new Image();
    var imgWidth = 285;
    var imgHeight = 40;

	 newImg.onload = function() {
	    imgHeight = Math.round(imgWidth/this.width*this.height);
		if(isNaN(imgHeight) || imgHeight <= 0) {
			snapShotDiv.onmouseover = function() {
				tipWindow.show('<h4>' + layerName + '</h4>' + '<p><img width=285px src="' + legendURL + '.png' + '"></p><p>Click to see it in main map. For more complete metadata, see Map Information on the right panel.</p>'); // @NL
		};
		} else {
			snapShotDiv.onmouseover = function() {
				tipWindow.show('<h4>' + layerName + '</h4>' + '<p><img width="' + imgWidth + 'px" height="' + imgHeight + 'px" ' + 'src="' + legendURL + '.png' + '"></p><p>Click to see it in main map. For more complete metadata, see Map Information on the right panel.</p>'); // @NL
			};
		}
	}
	
    newImg.src = legendURL + '.png';
	
	snapShotDiv.onmouseout = function() {
		tipWindow.hide(); 
	};		
	
	}
};

monsoon.maps.GMapSnapshot.prototype.setMapCenter = function(centerPos) {
	if(this.map_) {
		//google.maps.event.trigger(this.map_, 'resize');
		this.map_.setCenter(centerPos);
	}
};

monsoon.maps.GMapSnapshot.prototype.setMapPos = function(centerPos, zoom) {
	if(this.map_) {
		//google.maps.event.trigger(this.map_, 'resize');
		this.map_.setCenter(centerPos);
		this.map_.setZoom(zoom);
	}
};

monsoon.maps.GMapSnapshot.prototype.tilesLoaded = function() {
};

monsoon.maps.GMapSnapshot.prototype.addClickEvent = function(layerControlObj) {
	var snapShotDiv = goog.dom.getElement(this.div_);
	var layerName = this.layerName_;
	var tipWindow = this.tooltip_;
	var metaSrc = 'js/data/' + this.rasterLayerObj_.legendSrc + '.html';
	
	snapShotDiv.onclick = function() {
			// let the menu know: turn on the layer	
			//layerControlObj.updateChecked(layerName, true);
			layerControlObj.toggleChecked(layerName, true);
			$.get(metaSrc, function (data) {
			   $('#MapInfoDiv').html(data);
			})
			.error(function()  { $('#MapInfoDiv').html("Oops! No information found!");});
			
		};
		
};

