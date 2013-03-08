
goog.provide('monsoon.maps.GThematicMapLayer');

goog.require('monsoon.maps.GThematicMapFeature');
goog.require('goog.structs.LinkedMap');

monsoon.maps.GThematicMapLayer = function (map) {
	// Now initialize all properties.
	this.map_ = map;
	this.mapDataSet = new goog.structs.LinkedMap();
};

/*
The complete prototype stle class/object definition with attributes and methods. 
*/
monsoon.maps.GThematicMapLayer.prototype.map_ = null; // the google map object that images will be attached to.
monsoon.maps.GThematicMapLayer.prototype.baseURL = 'http://sunsp.net/download/maptiles'; // image tiles address

monsoon.maps.GThematicMapLayer.prototype.mapDataSet = null; // a linked map structure, with zoom-tileX-tileY as key and featureCollection as value.

monsoon.maps.GThematicMapLayer.prototype.tileRequestSet = null;
monsoon.maps.GThematicMapLayer.prototype.latestZoom = -1;

// Shared map layer properties
monsoon.maps.GThematicMapLayer.prototype.minZoom = 0;
monsoon.maps.GThematicMapLayer.prototype.maxZoom = 8;
monsoon.maps.GThematicMapLayer.prototype.visible = false;
monsoon.maps.GThematicMapLayer.prototype.layerIndex = 0; // the index of the layer in the overlayMapTypes array
monsoon.maps.GThematicMapLayer.prototype.layerName = 'Thematic Layer';
monsoon.maps.GThematicMapLayer.prototype.layerType = 'Thematic';
monsoon.maps.GThematicMapLayer.prototype.currentActiveName = 'USA';

monsoon.maps.GThematicMapLayer.prototype.draw = function() {
	
	if(this.mapDataSet) {
		var featureSet = this.mapDataSet.getValues();
		
		if(featureSet) {
			var featureObj; 
			for(var i = 0; i < featureSet.length; i++) {
					featureObj = featureSet[i];
					featureObj.setMap(this.map_);
			}
		}
	}
};

// Note that the visibility property must be a string enclosed in quotes
monsoon.maps.GThematicMapLayer.prototype.hideLayer = function() {
	if(this.mapDataSet) {
		this.visible = false;
		var keyStrs = this.mapDataSet.getKeys();
		var keyStr;
		if(keyStrs) {
			var featureObj; 
			for(var i = 0; i < keyStrs.length; i++) {
					keyStr = keyStrs[i];

					if(keyStr.indexOf('_side') != -1) {
						continue;					
					}
					
					featureObj = this.mapDataSet.get(keyStr);

					if(featureObj) {

						featureObj.instantVisible = false;
						featureObj.hide();
					}
			}
		}
	}
};

// Only show the active one. Hide others
monsoon.maps.GThematicMapLayer.prototype.showLayer = function() {
	var mapObj = this.map_;
	var curZoom = mapObj.getZoom();
	this.visible = true;
	if(curZoom < this.minZoom || curZoom > this.maxZoom) {
		return;	
	}	
	
	if(this.mapDataSet) {
		var keyStr = this.currentActiveName;		
		if(this.mapDataSet.containsKey(keyStr)) {
			var chartObj = this.mapDataSet.get(keyStr);
				if(chartObj) {
					chartObj.instantVisible = true;
					chartObj.show();
				}
		}

		var keyStrs = this.mapDataSet.getKeys();
		
		if(keyStrs) {
			var featureObj; 
			for(var i = 0; i < keyStrs.length; i++) {
					keyStr = keyStrs[i];

					if(keyStr.indexOf('_side') != -1) {
						continue;					
					}
					
					featureObj = this.mapDataSet.get(keyStr);

					if(featureObj && keyStr != this.currentActiveName) {

						featureObj.instantVisible = false;
						featureObj.hide();
					}
			}
		}
	}
};


monsoon.maps.GThematicMapLayer.prototype.onTilesLoaded = function(){

};

monsoon.maps.GThematicMapLayer.prototype.updateDataVal = function(keyStr, newVal) {
	if(keyStr == '') {
		keyStr = this.currentActiveName;		
	}
	
	if(this.mapDataSet.containsKey(keyStr)) {
		var chartObj = this.mapDataSet.get(keyStr);
		if(chartObj) {
			chartObj.data_.setValue(0,1,newVal);
			chartObj.data_.setValue(1,1, 100-newVal);
			chartObj.draw();
		}
		
		if(this.mapDataSet.containsKey(keyStr+'_side')) {
			var gChartObj = this.mapDataSet.get(keyStr + '_side');
			if(gChartObj && gChartObj[0]) {
				gChartObj[0].draw(chartObj.data_, gChartObj[1]);
			}
		}
	}
};

monsoon.maps.GThematicMapLayer.prototype.getVisData = function() {
	var keyStr = this.currentActiveName;		
	var rtnVal = -1.0;	
	if(this.mapDataSet.containsKey(keyStr)) {
		var chartObj = this.mapDataSet.get(keyStr);
		if(chartObj) {
			chartObj.repositionMap();
			rtnVal = chartObj.data_.getValue(0,1);
		}
	}
	
	return rtnVal;
};

monsoon.maps.GThematicMapLayer.prototype.loadExampleLayer = function() {

	var tmpLoc = new google.maps.LatLng(40,-98);
	var data = google.visualization.arrayToDataTable([
       ['Label', 'Value'],
       ['Yield', 80],
       ['Gap', 20]
     ]);

     var options = {
       redFrom: 90, redTo: 100,
       yellowFrom:75, yellowTo: 90,
       minorTicks: 5,
       animation:{
        duration: 1000,
        easing: 'out'
		}
     };
	
	var tmpGauge = new monsoon.maps.GThematicMapFeature(tmpLoc, null, this.map_, 'gauge',data, options);
	//tmpGauge.setMap(map);
	tmpGauge.optimalZoom_ = 3;
	this.mapDataSet.set('USA', tmpGauge);
	
	tmpLoc = new google.maps.LatLng(64,101);
	data = google.visualization.arrayToDataTable([
       ['Label', 'Value'],
       ['Realized Yield', 35],
       ['Yield Gap', 65]
     ]);
     	
   options = {
		 legend: {position :'none'}, tooltip : {text : 'both'}, 
		 backgroundColor: {fill : 'transparent'},
		 chartArea:{left:0,top:0,width:"100%",height:"100%"}
     };
       	
	tmpGauge = new monsoon.maps.GThematicMapFeature(tmpLoc, null, this.map_, 'pie', data, options);
	//tmpGauge.setMap(map);
	tmpGauge.optimalZoom_ = 3;
	this.mapDataSet.set('RUS', tmpGauge);
	
	tmpLoc = new google.maps.LatLng(34,108);
	data = google.visualization.arrayToDataTable([
          ['Crops', 'Yield', 'Gap'],
          ['Maize',      75,    25],
          ['Soybean',    25,    75],
          ['Wheat',      85,    15],
          ['Rice',       95,     5]
        ]);

        options = {
		  //width: 200, height: 100,
          title: 'Yield Gap in 2008',
          hAxis: {title: '', titleTextStyle: {color: 'red'}},
      		 backgroundColor: {fill : 'transparent'},
			 chartArea:{left:0,top:0,width:"100%",height:"100%"}
			 //,animation:{duration: 10, easing: 'linear'}
        };

 	tmpGauge = new monsoon.maps.GThematicMapFeature(tmpLoc, null, this.map_, 'bar', data, options);
	//tmpGauge.setMap(map);
	tmpGauge.optimalZoom_ = 3;
	this.mapDataSet.set('CHN', tmpGauge);
};

monsoon.maps.GThematicMapLayer.prototype.loadLayer = function(data) {

	if(data.type == 'countryCollection') {
		var cntryList = data.countries;
		var currentIndex = 0;
		for(var i = 0; i < cntryList.length; i++) {
			var tmpLoc = new google.maps.LatLng(cntryList[i].Y,cntryList[i].X);
			var rVal = 50 + Math.random()*50;
			var vals = google.visualization.arrayToDataTable([
			   ['Label', 'Value'],
			   ['Yield', rVal],
			   ['Gap', 100 - rVal]
			 ]);

			 var options = {
			   redFrom: 90, redTo: 100,
			   yellowFrom:75, yellowTo: 90,
			   minorTicks: 5,
			   animation:{
				duration: 1000,
				easing: 'out'
				}
			 };
			
			var tmpGauge = new monsoon.maps.GThematicMapFeature(tmpLoc, null, this.map_, 'gauge', vals, options);
			var z = cntryList[i].Z;
			
			tmpGauge.width_ = 200/(1 << (z - 2));
			tmpGauge.height_ = 100/(1 << (z -2));

			this.mapDataSet.set(cntryList[i].C, tmpGauge);			
		}
	} 
};

monsoon.maps.GThematicMapLayer.prototype.loadCountry = function(data, countryCode) {
	
	if(this.mapDataSet.containsKey(countryCode)) {
		this.currentActiveName = countryCode;
		var mapFeatureObj = this.mapDataSet.get(countryCode);
		this.updateOutputPanel(countryCode, mapFeatureObj.data_, mapFeatureObj.type_, mapFeatureObj.displayOptions_);

		if(this.visible) {
			this.showLayer();		
		}		
		
		return;
	}
	
	if(data.type == 'countryCollection') {
		var cntryList = data.countries;
		for(var i = 0; i < cntryList.length; i++) {
		
			if(countryCode != cntryList[i].C) {
				continue;
			}
			
			var tmpLoc = new google.maps.LatLng(cntryList[i].Y,cntryList[i].X);
			var rVal = 50 + Math.floor(Math.random()*50);
			var vals = google.visualization.arrayToDataTable([ ['Label', 'Value'],  ['Yield', rVal]
			,['Gap', 100 - rVal]
			 ]);

			var options;
			var tmpGauge;
			var typeName = 'gauge';
			
			if(countryCode < 'AST') {
				 options = {
				   redFrom: 90, redTo: 100,
				   yellowFrom:75, yellowTo: 90,
				   minorTicks: 5,
				   animation:{
					duration: 1000,
					easing: 'out'
					}
				 };
	
				tmpGauge = new monsoon.maps.GThematicMapFeature(tmpLoc, null, this.map_, 'gauge', vals, options, this.visible);
				
			 } else {

				options = {
				 legend: {position :'none'}, tooltip : {text : 'both'}, 
				 backgroundColor: {fill : 'transparent'},
				 chartArea:{left:0,top:0,width:"100%",height:"100%"}
		     };
		       	
		      typeName = 'pie';
			   tmpGauge = new monsoon.maps.GThematicMapFeature(tmpLoc, null, this.map_, 'pie', vals, options, this.visible);
			}

			this.currentActiveName = countryCode;

			this.updateOutputPanel(cntryList[i].C, vals, typeName, options);
					
			var z = cntryList[i].Z;
			tmpGauge.optimalZoom_ = z;
			
			tmpGauge.width_ = 200/(1 << (z - 2));
			tmpGauge.height_ = 100/(1 << (z -2));
			this.mapDataSet.set(cntryList[i].C, tmpGauge);
			
			if(this.visible) {
				this.showLayer();		
			}		
			break;
		}
	} 
};



monsoon.maps.GThematicMapLayer.prototype.updateOutputPanel = function(cntryCode, data, typeName, options) {
	
	var table = new google.visualization.Table(document.getElementById('crop_table_out_div'));
  	table.draw(data, {showRowNumber: true});
  	var chartObj = null;
  	
  	if(typeName =='ge') { //'gauge'
 
        options = {
		    width: 150, height: 300,
          title: 'Yield Gap',
          hAxis: {title: '', titleTextStyle: {color: 'red'}},
      		 backgroundColor: {fill : 'transparent'},
			 chartArea:{left:0,top:0,width:"90%",height:"90%"},
			 animation:{duration: 10, easing: 'linear'}
        };  		
  		
	   chartObj = new google.visualization.ColumnChart(document.getElementById('crop_chart_out_div'));
  	} else { //}if(typeName =='pie') {
  		
  		options = {
		 legend: {position :'none'}, tooltip : {text : 'both'}, 
		 backgroundColor: {fill : 'transparent'},
		 chartArea:{left:0,top:0,width:"100%",height:"100%"},
		 is3D: true
		};
 		chartObj = new google.visualization.PieChart(document.getElementById('crop_chart_out_div'));		
  	}

	if(chartObj) {
		chartObj.draw(data, options);
		this.mapDataSet.set(cntryCode + '_side', new Array(chartObj, options));
	}
};


