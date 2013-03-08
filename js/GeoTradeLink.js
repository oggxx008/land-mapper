/**
* Google Polyline (Marker) Map
* Loads and displays encoded polygon shapes in JSON (JavaScript Object Notation).
* By Shipeng Sun, GLI at IonE, UMN.
*/

goog.provide("monsoon.maps.GeoTradeLinkLayer");
goog.require("goog.structs.LinkedMap");
goog.require('monsoon.maps.Util');

// Initialize the layer with Google maps object
/**
 * @constructor
*/
monsoon.maps.GeoTradeLinkLayer = function(GmapObj) {
	this.map = GmapObj;
};

monsoon.maps.GeoTradeLinkLayer.prototype.map = null;
monsoon.maps.GeoTradeLinkLayer.prototype.curRegionName = null;
monsoon.maps.GeoTradeLinkLayer.prototype.tooltip = null;

monsoon.maps.GeoTradeLinkLayer.prototype.tradeInfo = null;

// Shared map layer properties
monsoon.maps.GeoTradeLinkLayer.prototype.minZoom = 0;
monsoon.maps.GeoTradeLinkLayer.prototype.maxZoom = 4;
monsoon.maps.GeoTradeLinkLayer.prototype.visible = false;
monsoon.maps.GeoTradeLinkLayer.prototype.layerIndex = 0; // the index of the layer in the overlayMapTypes array
monsoon.maps.GeoTradeLinkLayer.prototype.layerName = "Trade Link Layer";
monsoon.maps.GeoTradeLinkLayer.prototype.layerType = "TradeLink";
monsoon.maps.GeoTradeLinkLayer.prototype.exportMode = true; // if true, show export; otherwise, show import

monsoon.maps.GeoTradeLinkLayer.prototype.loadGeogAdminList = function (adminList) {
	// adminList is a JSON object with a list of {C, N, X, Y, Z}
	// Use this to build a LinkedMap with name as key
	this.tradeInfo = new goog.structs.LinkedMap(200, true);
	
	if(adminList.type == 'countryCollection') {
		var cntryList = adminList.countries;
		var currentIndex = 0;
		for(var i = 0; i < cntryList.length; i++) {
			this.tradeInfo.set(cntryList[i].N, cntryList[i]);
		}
	}
}

// Adds a geo-link to the map instance.
monsoon.maps.GeoTradeLinkLayer.prototype.addTradeLink = function(regionInfo, tradeList) {
	var self = this;
	var oX = regionInfo.X;
	var oY = regionInfo.Y;
	var oName = regionInfo.N;
	var dX = 0;
	var dY = 0;
	regionInfo.geoLinks = new Array();
	
	// Get the values in an array to calculate groups/classification for visualization
	var valsArray = new Array();
	
	for (var i = 0; i < tradeList.length; i++) {
		// something related to line width tradeList[i].IV
		var partner = tradeList[i].I; // ID of the trading parterner
		var name = partner.split("_")[1];
		var valTradeOut = parseFloat(tradeList[i].OV);
		var valTradeIn = parseFloat(tradeList[i].IV);
		
		if(this.exportMode) {
			if(valTradeOut != null && valTradeOut > 0.00001) {
				valsArray.push(valTradeOut);
			}
		} else {
			if(valTradeIn != null && valTradeIn > 0.00001) {
				valsArray.push(valTradeIn);
			}
		}
	}	
	
	var qantVals = monsoon.maps.Util.quantiles(valsArray, 8);
	var nameValue = '';
	var valTrade = 0.0;
	
	for (var i = 0; i < tradeList.length; i++) {
		// something related to line width tradeList[i].IV
		var partner = tradeList[i].I; // ID of the trading parterner
		nameValue = partner.split("_")[1];
		valTrade = 0.0;
		//console.log('Partner:' + nameValue);
		
		if(this.exportMode) {
			valTrade = parseFloat(tradeList[i].OV);
		} else {
			valTrade = parseFloat(tradeList[i].IV);
		}		
		
		if(this.tradeInfo.containsKey(nameValue)) {
			var tradeEntry = this.tradeInfo.get(nameValue);
			dX = tradeEntry.X;
			dY = tradeEntry.Y;
		} else {
			continue;
		}
		
		if(valTrade <= 0.0001) {
			continue;
		}
		
		var linkCoordinates = [
			new google.maps.LatLng(oY, oX),
			new google.maps.LatLng(dY, dX)
		];
		
		
		var widthParam = monsoon.maps.Util.getIndexFromQuantiles(valTrade, qantVals)
		var lineColor = monsoon.maps.Util.mixBiColor("#006600","#66CCFF",(widthParam/8.0))
		var edgeColor = monsoon.maps.Util.darkerColor(lineColor, 0.6);

      var lineSymbol = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        fillColor:edgeColor,
        fillOpacity: (widthParam+1)/9,
        strokeColor: edgeColor,
        scale: 0.65*widthParam
      };
		
		var linkPath = new google.maps.Polyline({
		  path: linkCoordinates,
        icons: [{
          icon: lineSymbol,
          offset: '100%'
        }],		  
		  strokeColor: lineColor,
		  strokeOpacity: (widthParam+1)/9,
		  strokeWeight: widthParam+1,
		  geodesic: true,
		  visible: this.visible
		});
			
		if (this.tooltip) {
			// Attach MouseOver behavior.
	
			linkPath.set('M',this.exportMode);
			linkPath.set('O',oName);
			linkPath.set('I',nameValue);
			linkPath.set('V',valTrade);
			linkPath.set('S',widthParam);
			
			google.maps.event.addListener(linkPath, 'mouseover', function() {
				var valStr = '<h4>'+ this.get('O') +'</h4><p>' + ((this.get('M'))?'Export To ':'Import From ') + this.get('I') + ': ' + this.get('V') +'</p>';
				self.tooltip.show( valStr);
			});

			// Attach MouseOut behavior.
			google.maps.event.addListener(linkPath, 'mouseout', function() {
				self.tooltip.hide();
			});
			
			google.maps.event.addListener(linkPath, 'dblclick', function() {
		    var count = 0;
		    var self = this;
          offsetId = window.setInterval(function() {
            count = (count + 1) % 200;

            var icons = self.get('icons');
            icons[0].offset = (count / 2) + '%';
            self.set('icons', icons);
            
            if(count == 0) {
					window.clearInterval(offsetId); 
	            icons[0].offset = '100%';
		         self.set('icons', icons);
            	}
            
        }, 20);
			});
		}

		regionInfo.geoLinks[i] = linkPath;
		// Attach polygon to map.
		linkPath.setMap(this.map);
	}
	
	// Autoplay the animation
	/*
	if(this.visible && false) {
		var tdCount = 0;
		
      tdOffsetId = window.setInterval(function() {
      		tdCount = (tdCount + 1) % 200;
      
			for(var i = 0; i < regionInfo.geoLinks.length; i++) {
				var tdLink = regionInfo.geoLinks[i];
	   		   var icons = tdLink.get('icons');
   		   		icons[0].offset = (tdCount / 2) + '%';
         		tdLink.set('icons', icons);
			}            
            
	      if(tdCount == 0) {
				window.clearInterval(tdOffsetId); 
				
				for(var i = 0; i < regionInfo.geoLinks.length; i++) {
					var tdLink = regionInfo.geoLinks[i];
		   		   var icons = tdLink.get('icons');
   			   		icons[0].offset = '100%';
         			tdLink.set('icons', icons);
				}				
  	    	}
            
        }, 20);

	}
	*/
};

// Clears all shapes from the map.
monsoon.maps.GeoTradeLinkLayer.prototype.clearLayer = function() {
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
monsoon.maps.GeoTradeLinkLayer.prototype.showLayer = function() {
	if (this.tradeInfo) {
		this.visible = true;
		var curRegionName = this.curRegionName;
		
		this.tradeInfo.forEach(function(val, key, lmObj) {
			if(val && val.geoLinks) {
				if(val.N == curRegionName) {
					for(var i =0; i < val.geoLinks.length; i++)
					{
					if(val.geoLinks[i]) {
						val.geoLinks[i].setVisible(true);
						}
					}
				} else {
					for(var i =0; i < val.geoLinks.length; i++)
					{
						if(val.geoLinks[i]) {
						val.geoLinks[i].setVisible(false);
						}
					}
				}
			}
		});
	}
};

// Clears all shapes from the map.
monsoon.maps.GeoTradeLinkLayer.prototype.hideLayer = function() {
	if (this.tradeInfo) {
		this.visible = false;
		var curRegionName = this.curRegionName;
		
		this.tradeInfo.forEach(function(val, key, lmObj) {
			if(val && val.geoLinks) {
				if(val.N == curRegionName) {
					for(var i = 0; i < val.geoLinks.length; i++)
					{
						if(val.geoLinks[i]) {
							val.geoLinks[i].setVisible(false);
						}
					}
				}
			}
		});
	}
};

/*
// Load the trade data from a specific region
monsoon.maps.GeoTradeLinkLayer.prototype.loadOneRegionTradeData = function(regionName) {

	if(this.tradeInfo.containsKey(regionName)) {
		this.curRegionName = regionName;
		var regionData = this.tradeInfo.get(regionName);
		
		if(regionData.tradeList == null) { // load the data only if it does not exist in the memory
			var self = this;
			var jFile = regionData.I.replace(' ','_');
			var tradeURL = encodeURI("js/data/Trade/" + jFile + ".json");
			$.ajax({
				url: tradeURL,
				dataType: 'json',
				crossDomain: true,
				success: function(data) {
					if(data.type == "tradeFlow") {
						regionData.tradeList = data.entries;
						self.addTradeLink(regionData, regionData.tradeList);
					}
				},
				error: function (xhr, txtStatus, thrownError) {
					console.log(xhr.status + ":" + thrownError + ":" + txtStatus);
					//console.log(xhr.responseText);
				}
			});	
		}		
	}
};
*/

// Load the trade data from a specific region
monsoon.maps.GeoTradeLinkLayer.prototype.loadOneRegionTradeData = function(regionName, callbackFunc) {

	if(this.tradeInfo.containsKey(regionName)) {
		this.curRegionName = regionName;
		var regionData = this.tradeInfo.get(regionName);
		
		if(regionData.tradeList == null && regionData.I && regionData.I != "") { // load the data only if it does not exist in the memory
			var self = this;
			var jFile = regionData.I.replace(' ','_');
			var tradeURL = encodeURI("js/data/Trade/" + jFile + ".json");
			$.ajax({
				url: tradeURL,
				dataType: 'json',
				crossDomain: true,
				success: function(data) {
					if(data.type == "tradeFlow") {
						regionData.tradeList = data.entries;
						self.addTradeLink(regionData, regionData.tradeList);
					}
					
					if(callbackFunc) {
						cllbackFunc();					
					}
				},
				error: function (xhr, txtStatus, thrownError) {
					console.log(xhr.status + ":" + thrownError + ":" + txtStatus);
					//console.log(xhr.responseText);
				}
			});	
		}		
	}
};



// Loads a new polygon set into the map.
monsoon.maps.GeoTradeLinkLayer.prototype.loadTradingRegionsList = function(url) {
	var self = this;
	this.clearLayer();

	// No cross-domain rules, this would not be able to get data from another website.		
	$.ajax({
		url: url,
		dataType: 'json',
		crossDomain: true,
		success: function(data) {
			if(data.type == "tradingRegions") {
			
				var regionList = data.regions;
				var dataEntry = null;
				//console.log(data.length);
				for (var i = regionList.length-1; i >= 0; i--) {
					if(self.tradeInfo.containsKey(regionList[i].N)) {
						dataEntry = self.tradeInfo.get(regionList[i].N);
						dataEntry.CD = regionList[i].C;
						dataEntry.I = regionList[i].I;
						//self.tradeInfo.set(regionList[i].N, dataEntry);
					}
				
				}
			}
		},
		error: function (xhr, txtStatus, thrownError) {
			console.log(xhr.status + ":" + thrownError + ":" + txtStatus);
			//console.log(xhr.responseText);
		}
	});
};


// Loads a new polygon set into the map.
monsoon.maps.GeoTradeLinkLayer.prototype.loadTradingRegionsList = function(url, defaultRegion) {
	var self = this;
	this.clearLayer();

	// No cross-domain rules, this would not be able to get data from another website.		
	$.ajax({
		url: url,
		dataType: 'json',
		crossDomain: true,
		success: function(data) {
			if(data.type == "tradingRegions") {
			
				var regionList = data.regions;
				var dataEntry = null;
				//console.log(data.length);
				for (var i = regionList.length-1; i >= 0; i--) {
					if(self.tradeInfo.containsKey(regionList[i].N)) {
						dataEntry = self.tradeInfo.get(regionList[i].N);
						dataEntry.CD = regionList[i].C;
						dataEntry.I = regionList[i].I;
						//self.tradeInfo.set(regionList[i].N, dataEntry);
					}
				
				}
				
				self.loadOneRegionTradeData(defaultRegion);
			}
		},
		error: function (xhr, txtStatus, thrownError) {
			console.log(xhr.status + ":" + thrownError + ":" + txtStatus);
			//console.log(xhr.responseText);
		}
	});
};

monsoon.maps.GeoTradeLinkLayer.prototype.onTilesLoaded = function() {
}
