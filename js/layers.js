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
 * @fileoverview Code to store Monsoon data for various types of data layers.
 * @author Michal Cierniak
 */

goog.provide('monsoon.maps.MapLayer');
goog.provide('monsoon.maps.MapLayerComputeInfo');
goog.provide('monsoon.maps.Tile');

goog.require('monsoon.maps.Util');



/**
 * Constructs a map layer object, which can be used to add a layer to the map.
 * @param {?string} table The ID of the table whose data is used for the layer.
 * @param {?string} field The name of the field whose data is used for the
 *     layer.
 * @param {string} display How is this layer displayed.
 * @param {?monsoon.maps.MapLayerComputeInfo=} opt_computeInfo If this is
 *     a computed layer, info about how it's computed.
 * @constructor
 */
monsoon.maps.MapLayer = function(
    table, field, display, opt_computeInfo) {

  /**
   * The table in the database that this layer reads from.
   * If this is a computed layer then this value will be {@code null}, but
   * there may be related table info available in the {@code computeInfo}
   * {@code baseLayer_}.
   * @type {?string}
   * @private
   */
  this.table_ = table;

  /**
   * The field in the database that this layer reads from.
   * @type {?string}
   * @private
   */
  this.field_ = field;

  /**
   * Information on how this layer is computed, or {@code null} when this
   * layer is not a computed layer.
   * @type {?monsoon.maps.MapLayerComputeInfo}
   * @private
   */
  this.computeInfo_ = opt_computeInfo || null;

  /**
   * How this layer is displayed - either 'grid', 'point', or 'hidden'.
   * @type {string}
   * @private
   */
  this.display_ = display;

  /**
   * All loaded tiles for this layer.
   * @type {Object}
   * @private
   */
  this.tiles_ = {};
};


/**
 * Set of allowed values for the display property of a map layer.
 * <p>
 * Supported values:
 * <ul>
 *   <li>'grid' (display as a grid),
 *   <li>'point' (display as discrete points),
 *   <li>'bubble_primary' (display as a grid with this layer controling the
 *       primary display attribute),
 *   <li>'bubble_secondary' (indicates that this layer contributes a
 *       secondary display attribute for the primary layer to display),
 *   <li>'hidden' (do not show on the map).
 * </ul>
 * @enum {string}
 */
monsoon.maps.MapLayer.Display = {
  GRID: 'grid',
  BUBBLE_PRIMARY: 'bubble_primary',
  BUBBLE_SECONDARY: 'bubble_secondary',
  HIDDEN: 'hidden',
  POINT: 'point'
};


/**
 * Gets the table in the database that this layer reads from.
 * @return {?string} the id of the table.
 */
monsoon.maps.MapLayer.prototype.getTable = function() {
  return this.table_;
};


/**
 * Gets the field in the database that this layer reads from.
 * @return {?string} the name of the field.
 */
monsoon.maps.MapLayer.prototype.getField = function() {
  return this.field_;
};


/**
 * Gets the compute info that describes how the data of
 * this layer is computed in liew of reading data from the database.
 * @return {?monsoon.maps.MapLayerComputeInfo} Either {@code null} for normal
 *     db layers, or an object with info on the computation used to determine
 *     the data.
 */
monsoon.maps.MapLayer.prototype.getComputeInfo = function() {
  return this.computeInfo_;
};


/**
 * Determines whether this layer is a "computed" layer versus a layer
 * whose data comes from the database.
 * @return {boolean} If the layer is computed.
 */
monsoon.maps.MapLayer.prototype.isComputedLayer = function() {
  return this.computeInfo_ != null;
};


/**
 * Gets the database layer that this computed layer is based upon.
 * @return {!monsoon.maps.MapLayer} The database layer, or the input layer
 *     if this is a database layer and not a computed layer.
 */
monsoon.maps.MapLayer.prototype.getDBLayer = function() {
  if (this.computeInfo_) {
    return this.computeInfo_.databaseLayer_;
  } else {
    return this;
  }
};


/**
 * Gets this layer's display attribute.
 * @return {string} how the layer is displayed, either 'grid', 'point'
 *     or 'hidden'.
 */
monsoon.maps.MapLayer.prototype.getDisplay = function() {
  return this.display_;
};


/**
 * Sets this layer's display attribute.
 * <p>
 * If the layer is being hidden then all the visible cells are deleted.
 * @param {!monsoon.maps.MapLayer.Display} display The display setting to apply.
 */
monsoon.maps.MapLayer.prototype.setDisplay = function(display) {
  if (display != this.display_ &&
      display == monsoon.maps.MapLayer.Display.HIDDEN) {
    this.deleteAllCells();
  }
  this.display_ = display;
};


/**
 * Gets the tiles loaded for the layer.
 * @return {Object} contains the tiles for the layer.
 */
monsoon.maps.MapLayer.prototype.getTiles = function() {
  return this.tiles_;
};


/**
 * @inheritDoc
 */
monsoon.maps.MapLayer.prototype.toString = function() {
  var description;
  if (this.computeInfo_) {
    description = this.computeInfo_.toString();
  } else {
    description = this.table_ + ':' + this.field_;
  }
  return description + '(' + this.display_ + ')';
};


/**
 * Checks if {@code that} object equals {@code this} object.
 * <p>
 * The display component of the layer is not considered when determining
 * equality.
 * @param {monsoon.maps.MapLayer} that The object to compare {@code this} to.
 * @return {boolean} If the two values are equal.
 */
monsoon.maps.MapLayer.prototype.equals = function(that) {
  if (that == null || that.constructor != monsoon.maps.MapLayer) {
    return false;
  }
  if (that.table_ != this.table_ || that.field_ != this.field_) {
    return false;
  }
  if (this.isComputedLayer()) {
    return that.computeInfo_.getDescription() ==
        this.computeInfo_.getDescription();
  }
  return true;
};


/**
 * Deletes all the cells in this layer.
 */
monsoon.maps.MapLayer.prototype.deleteAllCells = function() {
  var tiles = this.getTiles();

  for (var tileKey in tiles) {
    var tile = tiles[tileKey];
    tile.deleteCell();
  }
};


/**
 * Garbage collects all the tiles in this layer.
 */
monsoon.maps.MapLayer.prototype.gcAllTiles = function() {
  var tiles = this.getTiles();

  for (var tileKey in tiles) {
    var tile = tiles[tileKey];
    tile.deleteCell();
    delete tiles[tileKey];
  }
};


/**
 * Gets the tile at the given location.
 * @param {number} lat Latitude of the tile location.
 * @param {number} lng Longitude of the tile location.
 * @return {monsoon.maps.Tile} The tile, or {@code null} if none at the
 *     given location.
 */
monsoon.maps.MapLayer.prototype.getTile = function(lat, lng) {
  return this.tiles_[monsoon.maps.Util.createTileKey(lat, lng)];
};


/**
 * Sets the given tile in this layer, replacing any existing tile at the
 * same location.
 * @param {monsoon.maps.Tile} tile The tile to set.
 */
monsoon.maps.MapLayer.prototype.setTile = function(tile) {
  this.tiles_[tile.getKey()] = tile;
};



/**
 * Information about a computed {@link monsoon.maps.MapLayer}.
 * @param {string} description A description of how the computation
 *     is done, for diagnostic purposes.
 * @param {!monsoon.maps.MapLayer} databaseLayer A database map layer that
 *     this computed layer is based upon.
 * @constructor
 */
monsoon.maps.MapLayerComputeInfo = function(description, databaseLayer) {
  /**
   * A description of the computation used.
   * @type {string}
   * @private
   */
  this.description_ = description;

  /**
   * The database layer the computed layer is based upon.
   * @type {!monsoon.maps.MapLayer}
   * @private
   */
  this.databaseLayer_ = databaseLayer;
};


/**
 * @inheritDoc
 */
monsoon.maps.MapLayerComputeInfo.prototype.toString = function() {
  return this.description_;
};


/**
 * Gets the description.
 * @return {string} The description.
 */
monsoon.maps.MapLayerComputeInfo.prototype.getDescription = function() {
  return this.description_;
};


/**
 * Gets the base layer this computation is based upon.
 * @return {!monsoon.maps.MapLayer} The base layer.
 */
monsoon.maps.MapLayerComputeInfo.prototype.getDBLayer = function() {
  return this.databaseLayer_;
};


/**
 * Constructs a tile object, which is used to hold data in a MapLayer.
 * @param {number} lat The latitude of the tile.
 * @param {number} lng The longitude of the tile.
 * @param {Object} value The value of the tile.
 * @param {google.maps.MVCObject} cell The cell that displays the tile.
 * @constructor
 */
monsoon.maps.Tile = function(lat, lng, value, cell) {

  /**
   * Latitude of the tile.
   * @type {number}
   */
  this.lat = lat;

  /**
   * Longitude of the tile.
   * @type {number}
   */
  this.lng = lng;

  /**
   * Value stored in the tile.
   * @type {object}
   */
  this.value = value;

  /**
   * Cell used to display the tile.
   * @type {google.maps.MVCObject}
   */
  this.cell = cell;

  /**
   * Cache of the relative size of the cell, or {@code null} if never set.
   * <p>
   * Although there's a google.maps API to get the radius of the cell,
   * it returns the size in killometers rather than a relative size we use
   * here.
   * @type {?number}
   * @private
   */
  this.cellSize_ = null;

  /**
   * Cache of the cell color, or {@code null} never set.
   * <p>
   * It appears that there's a fillColor property in the cell, so we could
   * probably use that instead of this cache.
   * @type {?string}
   * @private
   */
  this.cellColor_ = null;
};


/**
 * Returns a LatLng object with the tile's location.
 * @return {google.maps.LatLng} The location of the tile.
 */
monsoon.maps.Tile.prototype.getLocation = function() {
  return new google.maps.LatLng(this.lat, this.lng);
};


/**
 * Creates a key for indexing tiles in {@code monsoon.maps.MapLayer.getTiles()}.
 * Only most significant digits of lat and lng are taken into account
 * to provide some resilience against floating point precision problems.
 * @return {string} The unique key for a given tile.
 */
monsoon.maps.Tile.prototype.getKey = function() {
  return monsoon.maps.Util.createTileKey(this.lat, this.lng);
};


/**
 * Deletes this tile's cell, and removes all listeners.
 */
monsoon.maps.Tile.prototype.deleteCell = function() {
  if (this.cell) {
    google.maps.event.clearInstanceListeners(this.cell);
    this.cell.setMap(null);
    this.cell.tile = null;
    this.cell = null;
    this.cellColor_ = null;
    this.cellSize_ = null;
  }
};


/**
 * Attaches a cell to this tile and to the given map.
 * @param {!google.maps.Map} map The map object this cell should be attached to.
 * @param {!google.maps.MVCObject} cell The cell to attach to this tile.
 */
monsoon.maps.Tile.prototype.attachCell = function(map, cell) {
  this.deleteCell();
  this.cell = cell;
  cell.tile = this;
  cell.setMap(map);
};


/**
 * Determines if the current tile's cell needs to be updated in order to look
 * right, given the input color and size for the cell.
 * @param {string} color Color value.
 * @param {number} size Optional size of the cell.
 * @return {boolean} Whether the cell needs to be updated.
 */
monsoon.maps.Tile.prototype.needsUpdate = function(color, size) {
  // Note that undefined parameters will compare equal to null cached values.
  return this.cellColor_ != color || this.cellSize_ != size;
};


/**
 * Updates the tile's cache to indicate the current cell color and size.
 * @param {string} color The new color value for the cell.
 * @param {number} size The new size of the cell.
 */
monsoon.maps.Tile.prototype.update = function(color, size) {
  this.cellColor_ = color;
  this.cellSize_ = size;
};
