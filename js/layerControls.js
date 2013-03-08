/*
This class/object controls all data layers of vectormaplayer and rastermaplayer types
*/

goog.provide("monsoon.maps.LayerControl");

goog.require("monsoon.maps.TiledRasterMap");    
goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.ui.CheckBoxMenuItem');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');

//goog.require("");

/**
 * @constructor
*/
monsoon.maps.LayerControl = function(GmapObj) {
	this.map = GmapObj;
	this.layerArray = new google.maps.MVCArray();
};


/*
The complete prototype stle class/object definition with attributes and methods. 
*/
	
monsoon.maps.LayerControl.prototype.map = null;
monsoon.maps.LayerControl.prototype.layerArray = null;
monsoon.maps.LayerControl.prototype.menuObj_ = null;

	
monsoon.maps.LayerControl.prototype.addRasterLayer = function(rasterMapLayer) {
	this.layerArray.push(rasterMapLayer);
};

	
monsoon.maps.LayerControl.prototype.addPolygonLayer = function(polygonLayer) {
	this.layerArray.push(polygonLayer);
};


monsoon.maps.LayerControl.prototype.updateVisible = function(layerName, visible) {
	
	var vLen = this.layerArray.getLength();
	
	for(var i = 0; i < vLen; i++)
	{
		var layerObj = this.layerArray.getAt(i);
		//console.log(layerObj + ":" + visible);
		if(layerObj.layerName == layerName)
		{
			if(visible) {
				layerObj.showLayer();				
			} else {
				layerObj.hideLayer();				
			}
		}
	}
};

/**
  * This would show/hide layers according to the "visible" field of each layer.
**/
monsoon.maps.LayerControl.prototype.updateAllLayerVisiblity = function() {
	
	var vLen = this.layerArray.getLength();
	
	for(var i = 0; i < vLen; i++)
	{
		var layerObj = this.layerArray.getAt(i);
		//console.log(layerObj + ":" + visible);
		if(layerObj.visible)
		{
			layerObj.showLayer();				
		} else {
			layerObj.hideLayer();				
		}

	}
};


monsoon.maps.LayerControl.prototype.updateChecked = function(layerName, boolVal) {

	var vLen = this.layerArray.getLength();
	
	for(var i = 0; i < vLen; i++)
	{
		var layerObj = this.layerArray.getAt(i);
		if(layerObj.layerName == layerName)
		{
			this.menuObj_.getChildAt(i).setChecked(boolVal);
			if(boolVal) {
				layerObj.showLayer();				
			} else {
				layerObj.hideLayer();
			}			
		} else {
			this.menuObj_.getChildAt(i).setChecked(false);			
			layerObj.hideLayer();			
		}
	}
};

/*
	If the layer is not visible, turn this on and turn all others off.
	If the layer is visible, turn this off.
*/
monsoon.maps.LayerControl.prototype.toggleChecked = function(layerName) {

	var vLen = this.layerArray.getLength();
	
	for(var i = 0; i < vLen; i++)
	{
		var layerObj = this.layerArray.getAt(i);
		if(layerObj.layerName == layerName)
		{
			var boolVal = this.menuObj_.getChildAt(i).isChecked();
			boolVal = !boolVal;
			this.menuObj_.getChildAt(i).setChecked(boolVal);
			if(boolVal) {
				layerObj.showLayer();				
			} else {
				layerObj.hideLayer();
			}			
		} else {
			this.menuObj_.getChildAt(i).setChecked(false);			
			layerObj.hideLayer();			
		}
	}
};

monsoon.maps.LayerControl.prototype.onTilesLoaded = function () {
	var vLen = this.layerArray.getLength();
	
	for(var i = 0; i < vLen; i++)
	{
		var layerObj = this.layerArray.getAt(i);
		layerObj.onTilesLoaded();				
	}
};

// Create a visibility control panel for all layers using google menu api checkedMenuItem	
monsoon.maps.LayerControl.prototype.createControlPanel = function(divName) {
	//console.log("create control:" + divName);
   var menuObj = new goog.ui.Menu();

	var vLen = this.layerArray.getLength();
   	var updateMethod = goog.bind(monsoon.maps.LayerControl.prototype.updateVisible, this);
	
	for(var i = 0; i < vLen; i++) 	{
		var layerObj = this.layerArray.getAt(i);
		menuObj.addItem(new goog.ui.CheckBoxMenuItem(layerObj.layerName));
	}    

	goog.events.listen(menuObj, 'action', function(e) {
	  var child = e.target;
	  updateMethod(child.getCaption(), child.isChecked());
	});
	
	menuObj.render(goog.dom.getElement(divName));
	
	this.menuObj_ = menuObj;

};

// Create a list of raster layers from JSON file with information on layer url, name, index, etc.	
monsoon.maps.LayerControl.prototype.createRasterLayersFromJSON = function(jsonPath) {
	var self = this;
	
	$.ajax({
		url: jsonPath,
		dataType: 'json',
		async: false,
		success: function(data) {
			//console.log(data.type);
			
			if(data.type == 'GLIRasterLayerFeature') {
				
				var imgLayersData = data.RasterLayers;
				//console.log(data.RasterLayers);
				
				for(var i = 0; i < imgLayersData.length; i++)
				{
					var imgLayer = new monsoon.maps.TiledRasterMap(self.map, new google.maps.Size(256,256));
					//console.log(data.RasterLayers[i]);
					imgLayer.baseURL = imgLayersData[i].tileURL;
					imgLayer.legendSrc = imgLayersData[i].legend_src; 
					imgLayer.layerName = imgLayersData[i].layerName; 
					imgLayer.layerIndex = imgLayersData[i].layerIndex; 
	
					self.addRasterLayer(imgLayer);  
				}
			}
		},
		error: function (xhr, txtStatus, thrownError) {
			console.log(xhr.status + ":" + thrownError + ":" + txtStatus);
			//console.log(xhr.responseText);
		}
		});		
};
	