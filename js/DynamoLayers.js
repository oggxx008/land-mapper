

monsoon.maps.Map.prototype.applyCropDynamo = function (layer, nPctgChange, binInfoDict) {
	var self = this;
	var tilesInView = self.getTilesInBounds(layer);
	
	var cellIDs = [];
	var lat, lng;
	// Get the list of IDs
	for(var i = 0; i < tilesInView.length; i++) 
	{
		lat = tilesInView[i].lat;
		lng = tilesInView[i].lng;
		cellIDs.push(convertLatLngToCellID(lat,lng));
	}
	
	// retrive all the climate bin ID with the given cellIDs
	var binIDs = retriveClimateBinIDs(cellIDs);
	var cell, binID, binInfo;
	var aY, bNP, bK, cN, cP, cK;
	for(var i = 0; i < tilesInView.length; i++) 
	{
		cell = tilesInView[i].cell; // the google maps MVC object
		binID = binIDs[i]; // the bin ID
		
		if(binInfoDict.containsKey(binID)) {
			binInfo = binInfoDict.get(binID);
			// The bin info contains parameters to calculate new modeled yields.
			aY = binInfo.yield_ceiling; // YMax
			bNP = binInfo.b_nut;
			bK = binInfo.b_K2O;
			cN = binInfo.c_N;
			cP = binInfo.c_P2O5;
			cK = binInfo.c_K2O;
			
			
			
			
		} else
		{
			continue;
		}
	}
}



/**
 Assume a 5 minute grid
**/
convertLatLngToCellID = function(lat, lng) {
	var xI = Math.ceil(lng*12);
	var yI = Math.ceil(lat*12);
	
	return xI + (yI-1)*4320;
}
getTilesInBounds