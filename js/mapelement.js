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
 * @fileoverview Classes that assist in map element creation.
 * @author Donn Denman
 */

goog.provide('monsoon.maps.CellInfo');
goog.provide('monsoon.maps.MapElementContext');
goog.provide('monsoon.maps.MapElementContextOptions');
goog.provide('monsoon.maps.MapElementInfo');
goog.provide('monsoon.maps.PointInfo');

goog.require('monsoon.maps.MapLayer');
goog.require('monsoon.maps.Util');



/**
 * Some context information needed for creating any map element.
 * @param {!monsoon.maps.MapLayer} layer The layer that the element will
 *     be in.
 * @param {!monsoon.maps.MapLayer.Display} display The display to be used
 *     for the layer.
 * @param {!monsoon.maps.MapElementContextOptions} options A set of optional
 *     parameters that determine different aspects of map elements.
 * @constructor
 */
monsoon.maps.MapElementContext = function(layer, display, options) {
  this.layer_ = layer;
  this.display_ = display;
  this.options_ = options;
};


/**
 * The minimum bubble size, in relative terms, where 1.0 has the radius of
 * a grid cell.
 * @type number
 * @private
 * @const
 */
monsoon.maps.MapElementContext.MIN_BUBBLE_SIZE_ = 0.1;


/**
 * Stroke weight for the perimeter of a map element.
 * @type number
 * @private
 * @const
 */
monsoon.maps.MapElementContext.STROKE_WEIGHT_ = 2;


/**
 * Default color gradient used to determine the fill color of map elements.
 * @type Array.<string>
 * @private
 * @const
 */
monsoon.maps.MapElementContext.COLOR_GRADIENT_ = ["#FF0000","#FFFF66", "#00FF00"];//["#0000FF","#FFFF66", "#993366"];
    //['#0000FF', '#00FF00', '#FF0000'];


/**
 * Gets the appropriate map element information for the given tile.
 * <p>
 * If the tile has the data needed to create a map element, but does not yet
 * have a map element, then a {@link monsoon.maps.MapElementInfo} object is
 * returned with {@code isUpdate} set to {@code false}, and the information
 * needed to create a map element to represent that data.
 * <p>
 * If the tile already has a map element, but the map element no longer
 * represents the current data, then a {@link monsoon.maps.MapElementInfo}
 * object is returned with {@code isUpdate} set to {@code true}, and the
 * information needed to update the cell.
 * <p>
 * If the tile does not have data to display, or if the data is already
 * represented by the current map element, then {@code null} is returned.
 *
 * @param {!monsoon.maps.Tile} tile The tile whose data will be represented.
 * @return {monsoon.maps.MapElementInfo} The information needed to create
 *     or update the map element, or {@code null} if no update or creation
 *     is needed.
 */
monsoon.maps.MapElementContext.prototype.getMapElementInfo = function(tile) {
  var value = tile.value;
  var lat = tile.lat;
  var lng = tile.lng;

  if (this.display_ != monsoon.maps.MapLayer.Display.POINT) {
    var color;
    var size;
    if (typeof this.options_.minValue == 'number' &&
        typeof this.options_.maxValue == 'number') {
      // Determine color of cell from the data range.
      color = monsoon.maps.Util.linearGradient(
          this.options_.minValue, this.options_.maxValue, value,
          monsoon.maps.MapElementContext.COLOR_GRADIENT_);

      // Determine size of the cell.
      if (this.display_ == monsoon.maps.MapLayer.Display.BUBBLE_PRIMARY) {
        // If we're doing the bubble layer, dynamically determine size from
        // the secondary layer.
        var sizeTile = this.options_.secondaryLayer.getTile(lat, lng);
        if (sizeTile && typeof sizeTile.value == 'number') {
          var sizeMin = this.options_.secondaryMinValue;
          var sizeMax = this.options_.secondaryMaxValue;
          size = (sizeTile.value - sizeMin) / (sizeMax - sizeMin);
          size = Math.max(
              size, monsoon.maps.MapElementContext.MIN_BUBBLE_SIZE_);
        }
      } else if (this.display_ == monsoon.maps.MapLayer.Display.GRID) {
        size = 1;
      }
    }
  }

  var cell = tile.cell;
  var isUpdate = !!cell;
  if (this.display_ == monsoon.maps.MapLayer.Display.BUBBLE_PRIMARY ||
      this.display_ == monsoon.maps.MapLayer.Display.GRID) {
    if (color != null && size != null && tile.needsUpdate(color, size)) {
      tile.update(color, size);
      return new monsoon.maps.CellInfo(tile, isUpdate,
          this.options_.latDelta, this.options_.lngDelta, color, size,
          monsoon.maps.MapElementContext.STROKE_WEIGHT_);
    }
  } else if (this.display_ == monsoon.maps.MapLayer.Display.POINT) {
    // This code assumes that values are strings and
    // are used as tooltips for markers.
    return new monsoon.maps.PointInfo(tile, isUpdate, value);
  } else {
    throw Error('Unknown display type: ' + this.display_);
  }
  return null;
};



/**
 * @interface
 */
monsoon.maps.MapElementContextOptions = function() {};

/**
 * @desc The distance between cells in the latitude direction.
 * @type number
 */
monsoon.maps.MapElementContextOptions.prototype.latDelta;

/**
 * @desc The distance between cells in the longitude direction.
 * @type number
 */
monsoon.maps.MapElementContextOptions.prototype.lngDelta;

/**
 * @desc The minimum value expected in this layer.
 * @type number
 */
monsoon.maps.MapElementContextOptions.prototype.minValue;

/**
 * @desc The maximum value expected in this layer.
 * @type number
 */
monsoon.maps.MapElementContextOptions.prototype.maxValue;

/**
 * @desc An additional layer that provides values for rendering along with
 *     the primary layer.
 * @type monsoon.maps.MapLayer
 */
monsoon.maps.MapElementContextOptions.prototype.secondaryLayer;

/**
 * @desc The minimum value expected in the secondary layer.
 * @type number
 */
monsoon.maps.MapElementContextOptions.prototype.secondaryMinValue;

/**
 * @desc The maximum value expected in the secondary layer.
 * @type number
 */
monsoon.maps.MapElementContextOptions.prototype.secondaryMaxValue;



/**
 * Base class for information on how to update or create a map element.
 * @param {!monsoon.maps.Tile} tile The tile this map element will appear on.
 * @param {boolean} isUpdate Whether the map element should be updated, or
 *     created.
 * @constructor
 */
monsoon.maps.MapElementInfo = function(tile, isUpdate) {
  this.tile = tile;
  this.isUpdate = isUpdate;
};

/**
 * Gets the latitude of the map element's tile.
 * @return {number} The latitude of the tile.
 */
monsoon.maps.MapElementInfo.prototype.getLat = function() {
  return this.tile.lat;
};


/**
 * Gets the longitude of the map element's tile.
 * @return {number} The longitude of the tile.
 */
monsoon.maps.MapElementInfo.prototype.getLng = function() {
  return this.tile.lng;
};



/**
 * Subclass of a {@link monsoon.maps.MapElementInfo} for creating or updating
 * a cell (a {@code google.maps.MVCObject}).
 * @param {!monsoon.maps.Tile} tile The tile this map element will appear on.
 * @param {boolean} isUpdate Whether the map element should be updated, or
 *     created.
 * @param {number} latDelta The grid size in the latitude direction.
 * @param {number} lngDelta The grid size in the longitude direction.
 * @param {string} fillColor The color to fill the element with.
 * @param {number} size The size of the element relative to the grid size.
 * @param {number} strokeWeight The thickness of the outline of the map element.
 * @constructor
 * @extends {monsoon.maps.MapElementInfo}
 */
monsoon.maps.CellInfo = function(
    tile, isUpdate, latDelta, lngDelta, fillColor, size, strokeWeight) {
  goog.base(this, tile, isUpdate);
  this.latDelta = latDelta;
  this.lngDelta = lngDelta;
  this.fillColor = fillColor;
  this.size = size;
  this.strokeWeight = strokeWeight;
};
goog.inherits(monsoon.maps.CellInfo, monsoon.maps.MapElementInfo);



/**
 * Subclass of a {@link monsoon.maps.MapElementInfo} for creating or updating
 * marker points.
 * @param {!monsoon.maps.Tile} tile The tile this map element will appear on.
 * @param {boolean} isUpdate Whether the map element should be updated, or
 *     created.
 * @param {string} value The marker text to show.
 * @constructor
 * @extends {monsoon.maps.MapElementInfo}
 */
monsoon.maps.PointInfo = function(tile, isUpdate, value) {
  goog.base(this, tile, isUpdate);
  this.value = value;
};
goog.inherits(monsoon.maps.PointInfo, monsoon.maps.MapElementInfo);
