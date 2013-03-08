
goog.provide('monsoon.maps.GThematicMapFeature');

monsoon.maps.GThematicMapFeature = function (coord, image, map, typeName, tableData, dispOptions) {
	//goog.base(this);
	var self = this;
	// Now initialize all properties.
	self.coordinates_ = coord;
	self.image_ = image;
	self.map_ = map;

	// We define a property to hold the image's
	// div. We'll actually create this div
	// upon receipt of the add() method so we'll
	// leave it null for now.
	self.div_ = null;
	
	self.type_ = typeName;
	self.data_ = tableData;
	self.displayOptions_ = dispOptions;
	self.instantVisible = true;
	
	// Explicitly call setMap on this overlay
	self.setMap(map);
};


monsoon.maps.GThematicMapFeature = function (coord, image, map, typeName, tableData, dispOptions, instantVis) {
	//goog.base(this);
	var self = this;
	// Now initialize all properties.
	self.coordinates_ = coord;
	self.image_ = image;
	self.map_ = map;

	// We define a property to hold the image's
	// div. We'll actually create this div
	// upon receipt of the add() method so we'll
	// leave it null for now.
	self.div_ = null;
	
	self.type_ = typeName;
	self.data_ = tableData;
	self.displayOptions_ = dispOptions;
	self.instantVisible = instantVis;
	
	// Explicitly call setMap on this overlay
	self.setMap(map);
};

monsoon.maps.GThematicMapFeature.prototype = new google.maps.OverlayView();
//goog.inherits(monsoon.maps.GThematicMapFeature, google.maps.OverlayView)

monsoon.maps.GThematicMapFeature.prototype.image_ = null;
monsoon.maps.GThematicMapFeature.prototype.div_ = null;
monsoon.maps.GThematicMapFeature.prototype.width_ = 100; // at zoom level 2
monsoon.maps.GThematicMapFeature.prototype.height_ = 50; // at zoom level 2
monsoon.maps.GThematicMapFeature.prototype.chartObj_ = null; 

monsoon.maps.GThematicMapFeature.prototype.map_ = null;
monsoon.maps.GThematicMapFeature.prototype.coordinates_ = null;
monsoon.maps.GThematicMapFeature.prototype.optimalZoom_ = 3;

monsoon.maps.GThematicMapFeature.prototype.type_ = null;
monsoon.maps.GThematicMapFeature.prototype.data_ = null;
monsoon.maps.GThematicMapFeature.prototype.displayOptions_ = null;
monsoon.maps.GThematicMapFeature.prototype.tooltip = null;
monsoon.maps.GThematicMapFeature.prototype.instantVisible = true;

monsoon.maps.GThematicMapFeature.prototype.onAdd = function() {

	// Note: an overlay's receipt of add() indicates that
	// the map's panes are now available for attaching
	// the overlay to the map via the DOM.

	// Create the DIV and set some basic attributes.
	var parentDiv = document.getElementById('map_canvas');
	var div = document.createElement('div');
	
	div.style.border = 'none';
	div.style.visibility = 'hidden';
    //div.style.borderStyle = 'solid';
    //div.style.borderWidth = '1px';
    //div.style.borderColor = '#AAAAAA';
	div.style.position = 'absolute';
	parentDiv.appendChild(div);

	var chartObj = null;
	
	if(this.type_ == 'gauge') {
 	  chartObj = new google.visualization.Gauge(div);
  	} else if(this.type_ == 'pie') {
 		chartObj = new google.visualization.PieChart(div);
   } else if(this.type_ == 'bar') {
		chartObj = new google.visualization.ColumnChart(div);   	
   	}

	chartObj.draw(this.data_, this.displayOptions_);

	// Set the overlay's div_ property to this DIV
	this.div_ = div;
	this.chartObj_ = chartObj;

	// We add an overlay to a map via one of the map's panes.
	// We'll add this overlay to the overlayImage pane.
	var panes = this.getPanes();
	//panes.overlayImage.appendChild(this.div_);
	panes.floatPane.appendChild(div);
};

monsoon.maps.GThematicMapFeature.prototype.draw = function() {

	// Size and position the overlay. We use a southwest and northeast
	// position of the overlay to peg it to the correct position and size.
	// We need to retrieve the projection from this overlay to do this.
	var overlayProjection = this.getProjection();

	// We'll use these coordinates to resize the DIV.
	var c = overlayProjection.fromLatLngToDivPixel(this.coordinates_);

	// Resize the image's DIV to fit the indicated dimensions.
	var curZoom = Math.max(2,this.map_.getZoom());
	var sizeFactor = 1 << (curZoom - 2);
	var  halfWidth  = Math.round(0.5*sizeFactor*this.width_); 
	var  halfHeight = Math.round(0.5*sizeFactor*this.height_);
	
	if(this.instantVisible) {
		this.div_.style.visibility = 'visible';
	} else {
		this.div_.style.visibility = 'hidden';
	}
	
	this.div_.style.width = (2*halfWidth) + 'px';
	this.div_.style.height = (2*halfHeight) + 'px';
	this.div_.style.left = (c.x - halfWidth) + 'px';
	this.div_.style.top  = (c.y - halfHeight) + 'px'; // this is graphic coordinates, top is 0 and bottom is larger, positive value.

	if(this.chartObj_) {
		//this.chartObj_.setOption('width', 2*halfWidth);
		//this.chartObj_.setOption('height', 2*halfHeight);
		//this.chartObj_.clearChart();
		this.chartObj_.draw(this.data_, this.displayOptions_);
	}

};

monsoon.maps.GThematicMapFeature.prototype.repositionMap = function() {
	if(this.map_) {
		var self = this;
		//setTimeout(function() {self.map_.setZoom(2);},1000);
		//setTimeout(function() {self.map_.panTo(self.coordinates_);},2000);
		//setTimeout(function() {self.map_.setZoom(Number(self.optimalZoom_));},3000);
		
		this.map_.panTo(this.coordinates_);	
		this.map_.setZoom(Number(this.optimalZoom_));
		//this.map_.setCenter(this.coordinates_);
	}
}

monsoon.maps.GThematicMapFeature.prototype.onRemove = function() {
	this.div_.parentNode.removeChild(this.div_);
};

// Note that the visibility property must be a string enclosed in quotes
monsoon.maps.GThematicMapFeature.prototype.hide = function() {
	if (this.div_) {
		this.div_.style.visibility = 'hidden';
}
};

monsoon.maps.GThematicMapFeature.prototype.show = function() {
	if (this.div_) {
		this.div_.style.visibility = 'visible';
}
};

monsoon.maps.GThematicMapFeature.prototype.toggle = function() {
	if (this.div_) {
		if (this.div_.style.visibility == 'hidden') {
		this.show();
		} else {
		this.hide();
		}
	}
};

monsoon.maps.GThematicMapFeature.prototype.toggleDOM = function() {
	if (this.getMap()) {
		this.setMap(null);
	} else {
		this.setMap(this.map_);
	}
};