// Copyright 2011 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Contains utility functions for monsoon.
 * @author Kevin Zhang
 */

goog.provide('monsoon.maps.Util');



/**
 * Creates a key for indexing tiles in {@code monsoon.maps.MapLayer.getTiles()}.
 * Only most significant digits of lat and lng are taken into account
 * to provide some resilience against floating point precision problems.
 * @param {google.maps.LatLng} lat Latitude of the center tile.
 * @param {google.maps.LatLng} lng Longitude of the center tile.
 * @return {string} The unique key for a given tile.
 */
monsoon.maps.Util.createTileKey = function(lat, lng) {
  return lat.toFixed(4) + ',' + lng.toFixed(4);
};


/**
 * Converts a tile key to a LatLng value.
 * @param {string} tileKey The tile key.
 * @return {!google.maps.LatLng} The lat lng object from the supplied key.
 */
monsoon.maps.Util.tileKeyToLatLng = function(tileKey) {
  var latlng = tileKey.split(',');
  return new google.maps.LatLng(latlng[0], latlng[1]);
};


/**
 * Creates a URL for a Monsoon data request for a specific
 * table or for metadata for all tables.
 * @param {string} id The id of the table. If empty, return a URL that
 *     requests metadata for all tables.
 * @param {string} field The field to fetch. Only used if id is provided.
 * @param {string} mapBounds Map bounds for data to be fetched. Only used if
 *     id is provided.
 * @param {number=} opt_limit Optional limit of the number of items to return,
 *     provides a default limit if empty(for safety reasons).
 * @return {string} The URL for a Monsoon data request.
 */
monsoon.maps.Util.dbRequestUrl = function(
    id, field, mapBounds, opt_limit) {
  var location = document.location;
  var dbUrl = location.protocol + '//' + location.host + '/db';
  if (id) {
    // The hard-coded limit is just for safety.
    var safetyLimit = opt_limit || 1000;
    dbUrl += '?limit=' + safetyLimit + '&table=' + id;
    if (field) {
      dbUrl += '&field=' + field;
    }
    if (mapBounds) {
      dbUrl += '&mapBounds=' + mapBounds;
    }
  }
  return dbUrl;
};


/**
 * Creates a URL for a Monsoon map for a specific table and field.
 * @param {string} id The id of the table to display.
 * @param {string} field The field to display.
 * @return {string} The URL for a Monsoon page visualizing the map.
 */
monsoon.maps.Util.mapUrl = function(id, field) {
  var location = document.location;
  var url = location.protocol + '//' + location.host + location.pathname;
  url += '?table=' + id + '&field=' + field;
  return url;
};


/**
 * Translates a LatLng to a new location with the provided deltas.
 * @param {google.maps.LatLng} location The old LatLng location.
 * @param {number} deltaLat Change in latitude.
 * @param {number} deltaLng Change in longitude.
 * @return {google.maps.LatLng} The new LatLng location.
 */
monsoon.maps.Util.translateLatLng = function(location, deltaLat, deltaLng) {
    return new google.maps.LatLng(
        location.lat() + deltaLat, location.lng() + deltaLng);
};


/**
 * Clones a {@link google.maps.LatLngBounds} and returns the new bounds.
 * @param {google.maps.LatLngBounds} bounds The bounds to be copied.
 * @return {google.maps.LatLngBounds} The copy of bounds.
 */
monsoon.maps.Util.cloneLatLngBounds = function(bounds) {
  return new google.maps.LatLngBounds(
      bounds.getSouthWest(), bounds.getNorthEast());
};


/**
 * Returns the union of two bounds.
 * @param {google.maps.LatLngBounds} b1 The 1st bounds.
 * @param {google.maps.LatLngBounds} b2 The 2nd bounds.
 * @return {google.maps.LatLngBounds} The smallest rectangle containing the
 *     union of the bounds.
 */
monsoon.maps.Util.unionLatLngBounds = function(b1, b2) {
  var newBounds = monsoon.maps.Util.cloneLatLngBounds(b1);
  newBounds.union(b2);
  return newBounds;
};


/**
 * Takes in a byte (0-255) as dec and returns it 2-digit hex.
 * @param {number} dec The decimal value of the byte.
 * @return {string} The hexadecimal value of the byte.
 */
monsoon.maps.Util.byteToHex = function(dec) {
  return (dec >> 4).toString(16) + (dec & 15).toString(16);
};


/**
 * Takes in an RGB triplet as bytes (0-255) and returns an HTML hex color.
 * @param {number} r The red color component.
 * @param {number} g The green color component.
 * @param {number} b The blue color component.
 * @return {string} The hex HTML color code.
 */
monsoon.maps.Util.rgbToColor = function(r, g, b) {
  return '#' +
      monsoon.maps.Util.byteToHex(r) +
      monsoon.maps.Util.byteToHex(g) +
      monsoon.maps.Util.byteToHex(b);
};


/**
 * Turns an HTML hex color, e.g. #FF9933, into an RGB triplet as an array.
 * @param {string} color The color in hex HTML code.
 * @return {Array.<integer>} The RGB color triplet as three {0-255} integers.
 */
monsoon.maps.Util.colorToRGB = function(color) {
  var r = parseInt(color.substring(1, 3), 16);
  var g = parseInt(color.substring(3, 5), 16);
  var b = parseInt(color.substring(5), 16);
  return [r, g, b];
};


/**
 * Returns a color for a percentage of an interval from a linear gradient with a
 * single color transition.
 * @param {float} fade The position of the value in the interval (0-1).
 * @param {string} sc The gradient's start color.
 * @param {string} fc The gradient's end color.
 * @return {string} The color associated with the given value.
 */
monsoon.maps.Util.linearGradientHelper = function(fade, sc, fc) {
  var scRGB = monsoon.maps.Util.colorToRGB(sc);
  var fcRGB = monsoon.maps.Util.colorToRGB(fc);

  var deltaR = fcRGB[0] - scRGB[0];
  var deltaG = fcRGB[1] - scRGB[1];
  var deltaB = fcRGB[2] - scRGB[2];

  return monsoon.maps.Util.rgbToColor(
      Math.floor(deltaR * fade) + scRGB[0],
      Math.floor(deltaG * fade) + scRGB[1],
      Math.floor(deltaB * fade) + scRGB[2]);
};


/**
 * Returns a color for a value within a set range from a linear gradient with
 * multiple color transitions.
 * @param {number} min The lower bound of the range.
 * @param {number} max The upper bound of the range.
 * @param {number} value A value within the range.
 * @param {Array.<string>} colors Ordered list of colors that form the gradient.
 * @return {string} The color associated with the given value.
 */
monsoon.maps.Util.linearGradient = function(min, max, value, colors) {
  if (value <= min) {
    return colors[0];
  }
  if (value >= max) {
    return colors[colors.length - 1];
  }

  var totalFade = (value - min) / (max - min) * (colors.length - 1);
  var currFade = totalFade % 1;
  var currGrad = Math.floor(totalFade);

  return monsoon.maps.Util.linearGradientHelper(
      currFade, colors[currGrad], colors[currGrad + 1]);
};

monsoon.maps.Util.mixBiColor = function(colorB, colorA, scaleFactor) {
	scaleFactor = scaleFactor<0.0?0.0:(scaleFactor >1.0?1.0:scaleFactor);
	var rgbA = monsoon.maps.Util.colorToRGB(colorA);
	var rgbB = monsoon.maps.Util.colorToRGB(colorB);
	
	var r = Math.floor(rgbB[0]*scaleFactor + rgbA[0]*(1-scaleFactor));
	var g = Math.floor(rgbB[1]*scaleFactor + rgbA[1]*(1-scaleFactor));
	var b = Math.floor(rgbB[2]*scaleFactor + rgbA[2]*(1-scaleFactor));
			
	return monsoon.maps.Util.rgbToColor(r,g,b);
}

/**
	* Mix three colors to get a terrain gradient like blue, yellow, purple
**/
monsoon.maps.Util.terrainGradient = function(colorA, colorB, colorC, numOut) {
	var outColors = new Array();	
	outColors.push("rgba(1,1,1,0.0)");
	var rgbA = monsoon.maps.Util.colorToRGB(colorA);
	var rgbB = monsoon.maps.Util.colorToRGB(colorB);
	var rgbC = monsoon.maps.Util.colorToRGB(colorC);
	var scaleFactor = 2.0/numOut;
	//console.log(rgbA);
	//console.log(scaleFactor);
	
	for(var i=0; i <= (numOut/2); i++) {
			var r = Math.floor(rgbB[0]*i*scaleFactor + rgbA[0]*(1-i*scaleFactor));
			var g = Math.floor(rgbB[1]*i*scaleFactor + rgbA[1]*(1-i*scaleFactor));
			var b = Math.floor(rgbB[2]*i*scaleFactor + rgbA[2]*(1-i*scaleFactor));
			outColors.push(monsoon.maps.Util.rgbToColor(r,g,b)); 				
	};
	
	for(var j = 1; j <=(numOut/2); j++) {
			var r = Math.floor(rgbC[0]*j*scaleFactor + rgbB[0]*(1-j*scaleFactor));
			var g = Math.floor(rgbC[1]*j*scaleFactor + rgbB[1]*(1-j*scaleFactor));
			var b = Math.floor(rgbC[2]*j*scaleFactor + rgbB[2]*(1-j*scaleFactor));
			outColors.push(monsoon.maps.Util.rgbToColor(r,g,b)); 				
	};
	
	return outColors;
};

monsoon.maps.Util.terrainColors = monsoon.maps.Util.terrainGradient("#0000FF","#FFFF66", "#993366",128);


/**
 * Returns a color for a value within a set range from a rainbow gradient.
 * TODO: Implement this function once we have a demand for it. A true
 * rainbow gradient is created with 3 phase-shifted sin waves.
 * @param {number} min The lower bound of the range.
 * @param {number} max The upper bound of the range.
 * @param {number} value A value within the range.
 * @return {string} The color associated with the given value.
 */
monsoon.maps.Util.rainbowGradient = function(min, max, value) {
  return '#FFFFFF';
};


monsoon.maps.Util.quantiles = function(vals, numClass) {
	var oVals = vals.sort(function(a,b){return a-b});
	if(oVals.length <= (numClass+1)) return oVals;
	
	var rslts = new Array();
	for(var i = 0; i < numClass; i++) {
		rslts.push(oVals[Math.floor(i*(oVals.length-1)/(numClass-1))]);
	}
	return rslts;
}

monsoon.maps.Util.getIndexFromQuantiles = function(val, quantiles) {
	for(var i = 0; i < quantiles.length; i++) {
		if(val <= quantiles[i]) {
			return i;
		}
	}
}

monsoon.maps.Util.darkerColor = function (colVal, ratio) {
	var rgbVal = monsoon.maps.Util.colorToRGB(colVal);
	ratio = ratio>1.0?1.0:ratio;
	return monsoon.maps.Util.rgbToColor(rgbVal[0]*ratio, rgbVal[1]*ratio, rgbVal[2]*ratio);

}
