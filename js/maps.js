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
 * @fileoverview Code to render a web page with a map displaying Monsoon data.
 *     This is an abstract class and is not meant to be instantiated directly.
 * @author Michal Cierniak
 */


goog.provide('monsoon.maps.Map');

goog.require('goog.dom');
goog.require('goog.events.EventType');

goog.require("monsoon.maps.MapTooltip");
goog.require("monsoon.maps.ProgressBar");
goog.require('monsoon.maps.DbBridge');
goog.require('monsoon.maps.MapElementContext');
goog.require('monsoon.maps.MapElementInfo');
goog.require('monsoon.maps.MapLayer');
goog.require('monsoon.maps.Util');
goog.require('monsoon.maps.GThematicMapFeature');
goog.require('monsoon.maps.GThematicMapLayer');
goog.require("monsoon.maps.GeogAdminList");
goog.require("monsoon.maps.TiledRasterMap");
goog.require("monsoon.maps.TiledVectorMap");
goog.require("monsoon.maps.PolygonLayer");
goog.require('monsoon.maps.GMapSnapshot');
goog.require("monsoon.maps.LayerControl");
goog.require('monsoon.maps.GMapSnapshotList');
goog.require("monsoon.maps.GeoTradeLinkLayer");
goog.require("monsoon.maps.GeoRegionMap");
goog.require('monsoon.maps.GMapS3Feature');


/**
 * Abstract base class that renders a map portion of a web page.
 * @param {string} implId The implementation ID, which provides an app name.
 * @param {monsoon.maps.DbBridge=} opt_dbBridge Optional bridge to the database,
 *     useful for testing.  Default is to use a default-constructed
 *     {@link monsoon.maps.DbBridge}.
 * @constructor
 */
monsoon.maps.Map = function(implId, opt_dbBridge) {
  /**
  * Parsed query parameters for convenient access.
  * @type {Object}
  * @private
  */
  this.queryParams_ = {};
  this.extractSearchParams();

  /**
  * Metadata for all known tables.
  * @type {Object}
  * @private
  */
  this.allTablesMetadata_ = {};

  /**
  * Currently displayed layers of data.
  * @type {Array}
  * @private
  */
  this.activeLayers_ = null;

  /**
  * Bounds of the data already loaded or being loaded.
  * @type {google.maps.LatLngBounds}
  * @private
  */
  this.dataBounds_ = null;

  /**
  * Active map.
  * @type {google.maps.Map}
  * @private
  */
  this.map_ = null;
  
  this.progressbar_ = null;
  
  this.userPanel_ = false; // true to show, false to hide
  
  this.scenarioPane_ = true;
  
  this.inputUserPanel_ = false;

  /**
  * Center of the map. Initialized to the location of Minnesota.
  * @type {google.maps.LatLng}
  * @private
  */
  this.mapCenter_ = new google.maps.LatLng(45, -93);

  /**
  * Number of loaded tiles.
  * @type {number}
  * @private
  */
  this.numberLoadedTiles_ = 0;

  /**
   * Info window for popups.
   * @type {google.maps.InfoWindow}
   * @private
   */
  this.infoWindow_ = null;

  /**
   * The object to use for database requests.
   * @type {!monsoon.maps.DbBridge}
   * @protected
   */
  this.dbBridge = opt_dbBridge || new monsoon.maps.DbBridge();

  /**
   * The identifier for this implemenation.
   * @type {string}
   * @private
   */
  this.implId_ = implId;

  /**
   * Map options.
   * @type {!Object}
   * @private
   */
  this.mapOptions_ = this.defaultMapOptions();
  
  this.mapLayersControl = null;
  this.mapSnapshotList_ = new monsoon.maps.GMapSnapshotList();
};


/**
 * How many more tiles than what's visible on the map do want to keep in memory.
 * @type {number}
 * @const
 */
monsoon.maps.Map.prototype.TILE_OVERLOAD_FACTOR = 2; // from 4 to 2


/**
 * How much bigger should the data bounds be than the map bounds in each
 * dimension after a GC.
 * @type {number}
 * @const
 */
monsoon.maps.Map.prototype.DATA_EXTENSION_FACTOR = 0.1; // from 0.2 to 0.1


/**
 * Default size of a region on the map to request, in the lat direction.
 * @type {number}
 * @private
 * @const
 */
monsoon.maps.Map.DEFAULT_SIZE_REQUEST_LAT_ = 2;


/**
 * Default size of a region on the map to request, in the lng direction.
 * @type {number}
 * @private
 * @const
 */
monsoon.maps.Map.DEFAULT_SIZE_REQUEST_LNG_ = 2; // from 4 to 2


/**
 * Returns the default map options.
 * @return {!Object} object containing the map options.
 */
monsoon.maps.Map.prototype.defaultMapOptions = function() {
  return {
   zoom: 10,
   minZoom: 8,
   center: new google.maps.LatLng(45, -93),
   mapTypeId: google.maps.MapTypeId.TERRAIN,
   streetViewControl: false,
   overviewMapControl:true,
   overviewMapControlOptions: {
				opened: true,
				position: google.maps.ControlPosition.LEFT_CENTER    
    		},
	zoomControl:true,		
	zoomControlOptions: {
    		style: google.maps.ZoomControlStyle.SMALL
  		},
   mapTypeControl:true,

   mapTypeControlOptions: {
      mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.TERRAIN, "GLI_Image"],
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
    }
    
  };

};


/**
 * Returns the map options for showing an updated map.
 * @return {Object} object containing the map options.
 */
monsoon.maps.Map.prototype.mapOptions = function() {
  return this.mapOptions_;
};


/**
 * @return {Object} Returns the query parameters.
 */
monsoon.maps.Map.prototype.getQueryParams = function() {
  return this.queryParams_;
};


/**
 * @return {Object} Returns the metadata for all known tables.
 */
monsoon.maps.Map.prototype.getAllTablesMetadata = function() {
  return this.allTablesMetadata_;
};


/**
 * Gets metadata for the given layer.
 * @param {!monsoon.maps.MapLayer} layer The layer to get metadata for.
 * @return {Object} Returns the metadata for the given layer.
 * @private
 */
monsoon.maps.Map.prototype.getLayerMetadata_ = function(layer) {
  return this.allTablesMetadata_[layer.getDBLayer().getTable()];
};


/**
 * Gets field info for the given layer.
 * @param {!monsoon.maps.MapLayer} layer The layer to get field info for.
 * @return {Object} Returns the field info for the given layer.
 * @private
 */
monsoon.maps.Map.prototype.getLayerFieldInfo_ = function(layer) {
  var metadata = this.getLayerMetadata_(layer);
  return metadata['fields'][layer.getDBLayer().getField()];
};


/**
 * @return {Object} Returns the currently displayed layers of data.
 */
monsoon.maps.Map.prototype.getActiveLayers = function() {
  return this.activeLayers_;
};


/**
 * @return {Object} Returns the bounds of the data being/already loaded.
 */
monsoon.maps.Map.prototype.getDataBounds = function() {
  return this.dataBounds_;
};


/**
 * @return {Object} Returns the active map.
 */
monsoon.maps.Map.prototype.getMap = function() {
  return this.map_;
};


/**
 * @return {Object} Returns the center of the map.
 */
monsoon.maps.Map.prototype.getMapCenter = function() {
  return this.mapCenter_;
};


/**
 * @return {google.maps.InfoWindow} Returns the info window instance.
 */
monsoon.maps.Map.prototype.getInfoWindow = function() {
  // TODO: Handle only 1 window at a time / create on first click.
  return this.infoWindow_;
};


/**
 * Resets all layers. Overlays are not removed from the map.
 */
monsoon.maps.Map.prototype.resetLayers = function() {
  this.activeLayers_ = [];
};


/**
 * Adds a new layer.
 * @param {monsoon.maps.MapLayer} newLayer The map layer to add to the map.
 * @return {monsoon.maps.MapLayer} The new layer added.
 */
monsoon.maps.Map.prototype.addMapLayer = function(newLayer) {
  this.activeLayers_.push(newLayer);
  return newLayer;
};


/**
 * Loads data for a new layer or replaced layer.
 * @param {monsoon.maps.MapLayer} layer The layer whose data should be loaded.
 */
monsoon.maps.Map.prototype.loadNewLayerData = function(layer) {
  var boundFunction = goog.bind(this.handleGetDataRequest, this);
  this.getDataForLayer(
      this.dataBounds_, boundFunction, true, layer);
};


/**
 * Replaces an existing map layer with a new layer, requesting that the new
 * layer data be loaded.
 * @param {monsoon.maps.MapLayer} oldLayer The layer to replace.
 * @param {monsoon.maps.MapLayer} newLayer The layer to use as the replacement.
 */
monsoon.maps.Map.prototype.replaceMapLayer = function(oldLayer, newLayer) {
  if (oldLayer) {
    for (var i = 0, layer; layer = this.activeLayers_[i]; i++) {
      if (layer == oldLayer) {
        oldLayer.gcAllTiles();
        if (newLayer) {
          this.activeLayers_[i] = newLayer;
        } else {
          // splice the array, removing the old layer.
          this.activeLayers_.splice(i, 1);
          layer.gcAllTiles();
        }
      }
    }
  } else if (newLayer) {
    this.addMapLayer(newLayer);
  }
  if (newLayer) {
    this.loadNewLayerData(newLayer);
  }
};


/**
 * Convert all layers to a string for debugging.
 * @return {string} String representation of all layers.
 */
monsoon.maps.Map.prototype.mapLayersAsString = function() {
  return this.activeLayers_.join(', ');
};


/**
 * Finds the first visible layer in the active layers list.
 * @return {monsoon.maps.MapLayer} The layer found, or {@code null} if there
 *     are no visible layers.
 */
monsoon.maps.Map.prototype.firstVisibleLayer = function() {
  for (var i = 0, layer; layer = this.activeLayers_[i]; i++) {
    if (layer.visibility != monsoon.maps.MapLayer.Display.HIDDEN) {
      return layer;
    }
  }
  return null;
};


/**
 * Finds the first layer with the specified display in the active layers list.
 * @param {monsoon.maps.MapLayer.Display} display The display type to find.
 * @return {monsoon.maps.MapLayer} The layer found, or {@code null} if there
 *     are no grid layers.
 */
monsoon.maps.Map.prototype.findDisplayLayer = function(display) {
  for (var i = 0, layer; layer = this.activeLayers_[i]; i++) {
    if (layer.getDisplay() == display) {
      return layer;
    }
  }
  return null;
};


/**
 * Gets a list of map cell locations from the given layer within the current
 * bounds.
 * @param {!monsoon.maps.MapLayer} layer The layer to get a list of cells from.
 * @return {Array.<google.maps.LatLng>} The list of cell locations.
 */
monsoon.maps.Map.prototype.getMapCellLatLngs = function(layer) {
  var cellLatLngs = [];
  var tiles = this.getTilesInBounds(layer);

  // check all tiles to filter for cells inside the bounds
  for (var i = 0, tile; tile = tiles[i]; i++) {
    var latlng = new google.maps.LatLng(tile.lat, tile.lng);
    cellLatLngs.push(latlng);
  }
  return cellLatLngs;
};


/**
 * Gets a list of map tiles from the given layer that are within the current
 * map bounds.
 * <p>
 * If the map bounds are not set up yet then the current data bounds are used
 * as the boundary restriction instead.
 * @param {!monsoon.maps.MapLayer} layer The layer to get a list of tiles from.
 * @return {Array.<monsoon.maps.Tile>} The list of tiles within the
 *     current bounds.
 */
monsoon.maps.Map.prototype.getTilesInBounds = function(layer) {
  var boundedTiles = [];
  var bounds = this.getMap().getBounds() || this.dataBounds_;
  var tiles = layer.getTiles();

  // check all tiles to filter for ones inside the bounds
  for (var attr in tiles) {
    var tile = tiles[attr];
    var latlng = new google.maps.LatLng(tile.lat, tile.lng);
    if (bounds && bounds.contains(latlng)) {
      boundedTiles.push(tile);
    }
  }
  return boundedTiles;
};


/**
 * Receives metadata for all tables and initiates XHR for loading map data.
 * @param {!Object} response Deserialized JSON object from the HTTP request for
 *     table metadata.
 */
monsoon.maps.Map.prototype.handleTableMetadataRequest = function(response) {
  if (response['status'] == 'OK') {
    this.allTablesMetadata_ = response['payload'];
  }

  // Now that metadata is loaded, we can set up active layers.
  this.setActiveLayers();

  // With metadata loaded and active layers set up, the initial view
  // of the web page can be created.
  this.makeInitialView();
};


/**
 * Makes initial UI by loading data for the map overlay and (possibly
 * in parallel) creating the sidebars.
 */
monsoon.maps.Map.prototype.makeInitialView = function() {
  // Because metadata is loaded, we can make the async request to draw the map.
  this.loadMap();
  this.createSidebar();
  this.createDisplaybar();
};


/**
 * Extracts search params into an object for convenient lookup.
 */
monsoon.maps.Map.prototype.extractSearchParams = function() {
  var search = location.search;
  if (search && search.charAt(0) == '?') {
    search = search.substr(1);  // Remove leading '?'
  }
  var paramsArray = search.split('&');

  this.queryParams_ = {};
  for (var i = 0; i < paramsArray.length; i++) {
    var paramPair = paramsArray[i].split('=');
    if (paramPair.length == 2) {
      this.queryParams_[paramPair[0]] = paramPair[1];
    }
  }
};


/**
 * Initializes the UI, loads data and displays it as an overlay.
 */
monsoon.maps.Map.prototype.setUpMonsoonMapPage = function() {
  if (!this.map_) {
    this.drawMap();
  }
	// move this to somewhere. Only when maps are loaded and the view is local, these will be called.   
	this.resetLayers();
  	this.dbBridge.requestMetadata(goog.bind(this.handleTableMetadataRequest, this));
};


/**
 * Parses data for a layer. If the layer is visible, also draws it on the map.
 * The code to update the center tile is also here although it should probably
 * be factored out into its own function.
 * @param {Object} mapData Content of a table to be displayed on the map.
 * @param {monsoon.maps.MapLayer} layer Description of the layer.
 */
monsoon.maps.Map.prototype.parseLayerData = function(mapData, layer) {
  //console.log("parseLayerData: %d", mapData.length);
  
  for (var i = 1; i < mapData.length; i++) {
    var curr = mapData[i];
    var lat = curr[0];
    var lng = curr[1];
    if (layer.getTile(lat, lng)) {
      continue;
    }
    var value = curr[2];

    var tile = new monsoon.maps.Tile(lat, lng, value, null);
    layer.setTile(tile);
    this.numberLoadedTiles_++;
	
	this.progressbar_.setCurrent(this.numberLoadedTiles_);
  }

  // create the display layer for the cells, if needed
  this.updateLayerDisplay(layer);
};


/**
 * Updates the display for the layer.  If the layer is now visible, creates
 * the cells to display in the layer.  If cell values change, they are
 * redrawn.
 * @param {!monsoon.maps.MapLayer} layer The layer whose display mode is being
 *     changed.
 * @param {!monsoon.maps.MapLayer.Display=} opt_display The display mode to
 *     apply.
 */
monsoon.maps.Map.prototype.updateLayerDisplay = function(layer, opt_display) {
  var display = opt_display || layer.getDisplay();
  layer.setDisplay(display);

  if (this.map_ && display != monsoon.maps.MapLayer.Display.HIDDEN &&
      display != monsoon.maps.MapLayer.Display.BUBBLE_SECONDARY) {

    // For grid cells (as opposed to points), set up the grid info
    var latDelta, lngDelta, minValue, maxValue;
    if (display != monsoon.maps.MapLayer.Display.POINT) {
      var metadata = this.getLayerMetadata_(layer);
      latDelta = metadata['lat_delta'];
      lngDelta = metadata['lon_delta'];
      var fieldInfo = this.getLayerFieldInfo_(layer);
      minValue = fieldInfo['min'];
      maxValue = fieldInfo['max'];
    }

    // For multi-layer cells, set up the secondary info
    var secondaryLayer, secondaryMinValue, secondaryMaxValue;
    if (display == monsoon.maps.MapLayer.Display.BUBBLE_PRIMARY) {
      secondaryLayer = this.findDisplayLayer(
          monsoon.maps.MapLayer.Display.BUBBLE_SECONDARY);
      secondaryLayer = secondaryLayer || layer;
      var sizeFieldInfo = this.getLayerFieldInfo_(secondaryLayer);
      secondaryMinValue = sizeFieldInfo['min'];
      secondaryMaxValue = sizeFieldInfo['max'];
    }

    // Create a context for cell/point creation
    // Note that for some layers, certain values are intentionally undefined.
    var context = new monsoon.maps.MapElementContext(layer, display, {
        latDelta: latDelta,
        lngDelta: lngDelta,
        minValue: minValue,
        maxValue: maxValue,
        secondaryLayer: secondaryLayer,
        secondaryMinValue: secondaryMinValue,
        secondaryMaxValue: secondaryMaxValue});

    // For each tile, figure out what needs to be created or modified, if any.
    var tiles = this.getTilesInBounds(layer);
    for (var i = 0, tile; tile = tiles[i]; i++) {
      var mapInfo = context.getMapElementInfo(tile);
      this.createMapElement_(tile, mapInfo);
    }
  }
  this.updateMapDebugInfo_();
};


/**
 * Creates a new map element, or updates an existing map element, based
 * on the supplied {@code mapInfo} object.  If an element is created,
 * it is attached to the given tile.
 * @param {!monsoon.maps.Tile} tile The tile to attach new map elements to.
 * @param {!monsoon.maps.MapElementInfo} mapInfo The information about
 *     whether to update or create a new map element and specifics about
 *     how the element should look.
 * @private
 */
monsoon.maps.Map.prototype.createMapElement_ = function(tile, mapInfo) {
  if (mapInfo) {
    var cell;
    if (mapInfo instanceof monsoon.maps.CellInfo) {
      if (mapInfo.isUpdate) {
        this.updateCell(mapInfo);
      } else {
        cell = this.createCell(mapInfo);
      }
    } else if (mapInfo instanceof monsoon.maps.PointInfo) {
      if (mapInfo.isUpdate) {
        throw Error('Can not update points!');
      } else {
        cell = this.createPoint(mapInfo);
      }
    }
    if (!mapInfo.isUpdate && cell) {
      tile.attachCell(this.map_, cell);
      this.attachCellListeners_(cell, mapInfo.latDelta, mapInfo.lngDelta);
    }
  }
};


/**
 * Attaches listeners to the given cell.
 * @param {!google.maps.Marker} cell The cell to attach to.
 * @param {number} latDelta The size of the cell's latitude.
 * @param {number} lngDelta The size of the cell's longitude.
 * @private
 */
monsoon.maps.Map.prototype.attachCellListeners_ = function(
    cell, latDelta, lngDelta) {
  // Add hover bindings for cell debug if cell is initialized.
  google.maps.event.addListener(
      cell,
      goog.events.EventType.MOUSEOVER,
      goog.bind(this.cellDebugOn_, this, cell));
  google.maps.event.addListener(
      cell,
      goog.events.EventType.MOUSEOUT,
      goog.bind(this.cellDebugOff_, this));

  // anchor offset for info windows
  // TODO: fix this offset problem and remove several parameters.
  if (this.implId_ != 'GLI') {
    cell.latOffset = latDelta / 2;
    cell.lngOffset = lngDelta / 2;
  }
};


/**
 * Updates the map debug info.
 * @private
 */
monsoon.maps.Map.prototype.updateMapDebugInfo_ = function() {
  var mapBoundsTxt = '';
  if (this.map_ && this.map_.getBounds()) {
    mapBoundsTxt = 'map: ' + this.map_.getBounds().toUrlValue() + ', ';
  }
  var dataBoundsUrl = (this.dataBounds_ && this.dataBounds_.toUrlValue()) ||
      null;
  var debugInfo = this.implId_ + '. ' + mapBoundsTxt +
      'data: ' + dataBoundsUrl +
      '<br/>zoom level:' + this.map_.getZoom() +
      '<br/>num requests: ' + this.dbBridge.getRequestCount() +
      ', num errors: ' + this.dbBridge.getErrorCount() +
      ', all tiles: ' + this.numberLoadedTiles_ +
      '<br/>Layers: ' + this.mapLayersAsString();

  var mapDebug = goog.dom.getElement('map_debug');
  mapDebug.innerHTML = debugInfo;
};


/**
 * Estimates the number of tiles needed to cover a rectangle.
 * Doesn't handle correctly wrapping around of coordinates.
 * Doesn't handle correctly tiles around the edges.
 * @param {google.maps.LatLngBounds} bounds Bounds to count in.
 * @param {monsoon.maps.MapLayer} layer The layer (needed for grid size).
 * @return {number} Number of tiles of a given size within given bounds.
 * @private
 */
monsoon.maps.Map.prototype.countTilesInRectangle_ = function(bounds, layer) {
  var boundsSW = bounds.getSouthWest();
  var boundsNE = bounds.getNorthEast();
  var metadata = this.getLayerMetadata_(layer);
  var latDelta = metadata['lat_delta'];
  var lonDelta = metadata['lon_delta'];
  var latNumTiles = (boundsNE.lat() - boundsSW.lat()) / latDelta;
  var lngNumTiles = (boundsNE.lng() - boundsSW.lng()) / lonDelta;
  return latNumTiles * lngNumTiles;
};


/**
 * Returns true is the coordinates are in bounds. The use of this method
 * currently ignores the fact that polygons have more than one corner and
 * we call this just for one representative corner.
 * @param {number} lat Latitude of a point.
 * @param {number} lng Longitude of a point.
 * @param {google.maps.LatLngBounds} bounds Bounds to check against.
 * @return {boolean} true if (lat, lng) is in bounds.
 * @private
 */
monsoon.maps.Map.prototype.inBounds_ = function(lat, lng, bounds) {
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast();
  return lat >= sw.lat() && lat <= ne.lat() && lng >= sw.lng() &&
      lng <= ne.lng();
};

monsoon.maps.Map.prototype.dataPntNumInBounds_ = function(bounds) {
   var mapBounds = null;
   if(bounds) {
   		mapBounds = bounds;
   	} else if(bounds == null && this.map_) {
		mapBounds = this.map_.getBounds();	
	} 
	
	if(mapBounds == null) {
		return 100;
		} else {
	  var sw = mapBounds.getSouthWest();
  	  var ne = mapBounds.getNorthEast();
	  return Math.abs(Math.ceil(ne.lat() -sw.lat())*12*Math.ceil(ne.lng()-sw.lng())*12);		
	} 
};


/**
 * Performs GC of tiles that are farthest away from the map and adjusts the data
 * bounds to exclude the area.
 * @private
 */
monsoon.maps.Map.prototype.gcFilterTiles_ = function() {
  console.log('Begin GC');
  var mapBounds = this.map_.getBounds();
  var mapSW = mapBounds.getSouthWest();
  var mapNE = mapBounds.getNorthEast();
  var latExtra = (mapNE.lat() - mapSW.lat()) * this.DATA_EXTENSION_FACTOR;
  var lngExtra = (mapNE.lng() - mapSW.lng()) * this.DATA_EXTENSION_FACTOR;

  var newDataSW = new google.maps.LatLng(
      mapSW.lat() - latExtra, mapSW.lng() - lngExtra);
  var newDataNE = new google.maps.LatLng(
      mapNE.lat() + latExtra, mapNE.lng() + lngExtra);
  var newDataBounds = new google.maps.LatLngBounds(newDataSW, newDataNE);
  console.log('newDataBounds: ' + newDataBounds);
  console.log('oldDataBounds: ' + this.dataBounds_);
  for (var i = 0; i < this.activeLayers_.length; i++) {
    var layer = this.activeLayers_[i];
    var tiles = layer.getTiles();
    var inBounds = 0;
    var outOfBounds = 0;
    for (var tileKey in tiles) {
      var tile = tiles[tileKey];
      if (this.inBounds_(tile.lat, tile.lng, newDataBounds)) {
        inBounds++;
      } else {
        outOfBounds++;
        if (tile.cell) {
          tile.cell.setMap(null);
          tile.cell = null;  // Not really needed.
        }
        delete tiles[tileKey];
        this.numberLoadedTiles_--;
      }
    }
    console.log('Deleted ' + outOfBounds + ' and kept ' + inBounds +
                ' tiles of field ' + layer.getField() +
                ' in ' + layer.getTable());
  }
  this.dataBounds_ = newDataBounds;
};


/**
 * Garbage collect all the tiles and clears the data bounds.
 */
monsoon.maps.Map.prototype.gcAllTiles = function() {
	if(this.activeLayers != null) {
	
  		console.log('New Location, Clearing All Tiles');

  		for (var i = 0; i < this.activeLayers_.length; i++) {
    		var layer = this.activeLayers_[i];
    		layer.gcAllTiles();
  		}
	}
	
  this.numberLoadedTiles_ = 0;
  this.dataBounds_ = null;
  
};


/**
 * Garbage collects the tiles.
 */
monsoon.maps.Map.prototype.gcTiles = function() {
  var mapBounds = this.map_.getBounds();

  // no data overlap for new map bounds, gc all tiles
  if (!this.dataBounds_) {
    return;
  }
  if (!mapBounds.intersects(this.dataBounds_)) {
    this.gcAllTiles();
    return;
  }

  // tentative new data bounds
  var newDataBounds = monsoon.maps.Util.unionLatLngBounds(
      this.dataBounds_, mapBounds);

  for (var i = 0; i < this.activeLayers_.length; i++) {
    var layer = this.activeLayers_[i];
    if (layer.getDisplay() == 'grid') {
      var numTilesOnMap = this.countTilesInRectangle_(mapBounds, layer);
      var numAllTilesNew = this.countTilesInRectangle_(newDataBounds, layer);
      if (numAllTilesNew > this.TILE_OVERLOAD_FACTOR * numTilesOnMap) {
        this.gcFilterTiles_();
      }
      break;  // Decision based on this one layer runs GC for all layers.
    } else if (layer.getDisplay() == 'point') {
      // TODO: Handle point data.
      // this.gcFilterTiles_();
    }
  }
};


/**
 * Receives table content and shows a map with an overlay displaying
 * received data.
 * @param {!Object} response Deserialized JSON object received from the HTTP
 *     request for table content.
 * @param {Object} layer Description of the layer.
 * @param {boolean} incremental Is this an incremental (true) or initial (false)
 *     request.
 */
monsoon.maps.Map.prototype.handleGetDataRequest = function(
    response, layer, incremental) {
  if (response['status'] == 'OK') {
    if (incremental) {
      this.parseLayerData(response['payload'], layer);
    } else {
      this.showMap(response['payload'], layer);
    }
    this.dataChanged();
  } else {
    // Insert debugging info into our page.
    var mapDebug = goog.dom.getElement('map_debug');
    goog.dom.setTextContent(
        mapDebug, 'Error while loading data: ' + response['status']);
  }
};


/**
 * Gets new data for a rectangle south, west, north or east from the current
 * data set. Also updates some bookkeeping info.
 * @param {google.maps.LatLng} swReq SW corner of the request rectangle.
 * @param {google.maps.LatLng} neReq NE corner of the request rectangle.
 * @param {google.maps.LatLng} swAll SW corner of the rectangle with all data.
 * @param {google.maps.LatLng} neAll NE corner of the rectangle with all data.
 */
monsoon.maps.Map.prototype.getNewData = function(
    swReq, neReq, swAll, neAll) {

	//console.log("call to getNewData:");
	var newDataRequestBounds = new google.maps.LatLngBounds(swReq, neReq);
	console.log('Incremental data request for: ' + newDataRequestBounds);

  	// We now update monsoon.maps.Map.dataBounds_ even though the request
  	// for new data hasn't completed yet. This avoids sending new requests
  	// for data that we already requested.

  	var boundFunction = goog.bind(this.handleGetDataRequest, this);
  	this.dataBounds_ = new google.maps.LatLngBounds(swAll, neAll);
  	this.getDataForActiveLayers(newDataRequestBounds, boundFunction, true);
};


/**
 * Starts XHR requests to get data for all active layers.
 * @param {google.maps.LatLngBounds} dataRequestBounds Rectangle to get
 *     data for.
 * @param {!Object} callback Function to call when data is received.
 * @param {boolean} incremental Is this an incremental (true) or initial (false)
 *     request.
 */
monsoon.maps.Map.prototype.getDataForActiveLayers = function(
    dataRequestBounds, callback, incremental) {
	
  console.log("active layers: %d",this.activeLayers_.length);

	if(this.progressbar_ == null && this.map_ == null) {
	
	  var progressbar = new monsoon.maps.ProgressBar();

 	  progressbar.draw("map_main");	  
	  this.progressbar_ = progressbar;
	} 
	
	if(this.progressbar_ == null) {
	  var progressbar = new monsoon.maps.ProgressBar();

 	  progressbar.draw("map_main");	  
	  this.progressbar_ = progressbar;
  	  this.map_.controls[google.maps.ControlPosition.RIGHT].push(this.progressbar_.getDiv());	  
	}

	  this.progressbar_.start(this.dataPntNumInBounds_(null));
	  this.progressbar_.setCurrent(0);
  
  for (var i = 0; i < this.activeLayers_.length; i++) {
    var layer = this.activeLayers_[i];
    this.getDataForLayer(dataRequestBounds, callback, incremental, layer);
  }
};


/**
 * Gets the data for the given layer, calling the callback when the
 * data arrives.
 * <p>
 * For computed layers no request is made and the callback is not called.
 * For database layers this starts an XHR request to get data for the layer.
 * @param {google.maps.LatLngBounds} dataRequestBounds Rectangle to get
 *     data for.
 * @param {!function(Object, monsoon.maps.MapLayer, boolean)} callback Function
 *     to call when data is received.
 * @param {boolean} incremental Is this an incremental (true) or initial (false)
 *     request.
 * @param {monsoon.maps.MapLayer} layer The layer whose data we should request.
 */
monsoon.maps.Map.prototype.getDataForLayer = function(
    dataRequestBounds, callback, incremental, layer) {
  	 if (!layer.isComputedLayer()) {
    this.dbBridge.getDataForLayer(dataRequestBounds, callback, incremental, layer);
	
  }
};

/**
 * Handles the loading and displaying of new data on the map.
 */
monsoon.maps.Map.prototype.updateTiles = function() {
  // Check tiles and perform gc if needed
  if (this.map_ && this.map_.getBounds()) {
    this.gcTiles();
  }

  // Check if we have tiles loaded
  if (this.dataBounds_) {
    this.loadTilesIncrementally();
  } else {
    this.loadTiles();
  }
};

/**
 * Loads new data and displays it on an empty map.
 */
monsoon.maps.Map.prototype.loadTiles = function() {
  var newDataBounds = this.map_.getBounds();
  var sw = newDataBounds.getSouthWest();
  var ne = newDataBounds.getNorthEast();
  this.getNewData(sw, ne, sw, ne);
};


/**
 * Loads new data and displays it incrementally on the map.
 */
monsoon.maps.Map.prototype.loadTilesIncrementally = function() {

  var map = this.map_;

  // Note that newMapBounds describes the geometry of the current viewport
  // of the map and oldMapBounds describes the geometry of the data we already
  // loaded (or that is in the process of being loaded).
  var oldDataSW = this.dataBounds_.getSouthWest();
  var oldDataNE = this.dataBounds_.getNorthEast();
  var newMapSW = map.getBounds().getSouthWest();
  var newMapNE = map.getBounds().getNorthEast();
  var latExtra = 1;
  var lngExtra = 1;
  if (newMapSW.lat() < oldDataSW.lat()) {
    // We will extend data south. Longitudes do not change.
    // The new data NE corner has the same latitude as the old SW corner.
    // The new data SW corner has the latitude of the new map SW corner and we
    // subtract latExtra to avoid constant requests when a sequence of events
    // fires when the user drags the map.
    var sw = new google.maps.LatLng(newMapSW.lat() - latExtra, oldDataSW.lng());
    var ne = new google.maps.LatLng(oldDataSW.lat(), oldDataNE.lng());
    this.getNewData(sw, ne, sw, oldDataNE);
  }
  oldDataSW = this.dataBounds_.getSouthWest();
  oldDataNE = this.dataBounds_.getNorthEast();
  if (newMapSW.lng() < oldDataSW.lng()) {
    // We will extend data west. Latitudes do not change.
    var sw = new google.maps.LatLng(oldDataSW.lat(), newMapSW.lng() - lngExtra);
    var ne = new google.maps.LatLng(oldDataNE.lat(), oldDataSW.lng());
    this.getNewData(sw, ne, sw, oldDataNE);
  }
  oldDataSW = this.dataBounds_.getSouthWest();
  oldDataNE = this.dataBounds_.getNorthEast();
  if (newMapNE.lat() > oldDataNE.lat()) {
    // We will extend data north. Longitudes do not change.
    var sw = new google.maps.LatLng(oldDataNE.lat(), oldDataSW.lng());
    var ne = new google.maps.LatLng(newMapNE.lat() + latExtra, oldDataNE.lng());
    this.getNewData(sw, ne, oldDataSW, ne);
  }
  oldDataSW = this.dataBounds_.getSouthWest();
  oldDataNE = this.dataBounds_.getNorthEast();
  if (newMapNE.lng() > oldDataNE.lng()) {
    // We will extend data east. Latitudes do not change.
    var sw = new google.maps.LatLng(oldDataSW.lat(), oldDataNE.lng());
    var ne = new google.maps.LatLng(oldDataNE.lat(), newMapNE.lng() + lngExtra);
    this.getNewData(sw, ne, oldDataSW, ne);
  }
};

/**
 * Called when the map's geometry was changed. Loads new data and displays
 * it incrementally on the map.
 */
monsoon.maps.Map.prototype.mapChanged = function() {
	//console.log("mapChanged()");
	this.mapCenter_ = this.map_.getCenter();
	this.updateTiles();
	this.notifyMapChanged();

	//console.log('Map changed');
};

monsoon.maps.Map.prototype.tilesLoaded = function() {
	//console.log("tilesLoaded()");
	
	if(this.progressbar_ != null && this.numberLoadedTiles_ > 0)
	{
		this.progressbar_.setTotal(this.numberLoadedTiles_);
		this.progressbar_.setCurrent(this.numberLoadedTiles_);
	}
	
	this.mapLayersControl.onTilesLoaded();
};


monsoon.maps.Map.prototype.hideShowUserPanel = function() {
	
	console.log("Clicked Panel Control");
}

/**
 * The UserPanelControl adds a control to the map that simply
 * shows the user panel.
 */

monsoon.maps.Map.prototype.UserPanelControl = function (controlDiv, map) {

  // Set CSS styles for the DIV containing the control
  // Setting padding to 5 px will offset the control
  // from the edge of the map.
  controlDiv.style.padding = '5px';

  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.background = 'white';
  controlUI.style.backgroundColor = 'white';
  controlUI.style.borderStyle = 'solid';
  controlUI.style.borderWidth = '0px';
  controlUI.style.cursor = 'pointer';
  //controlUI.style.width = '100px';
  controlUI.style.textAlign = 'center';
  controlUI.style.boxShadow = '3px 3px 2px #888888';
  controlUI.title = 'Hide or Show User Panel';
  
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlText2 = document.createElement('div');
  controlText2.style.fontFamily = 'Arial,sans-serif';
  controlText2.style.fontSize = '12px';
  controlText2.style.borderStyle = 'solid';
  controlText2.style.borderWidth = '1px';
  controlText2.style.borderColor = 'gray gray gray gray';
  controlText2.style.backgroundColor = 'white';
  controlText2.style.paddingLeft = '4px';
  controlText2.style.paddingRight = '4px';
  controlText2.style.paddingTop = '1px';
  controlText2.style.paddingBottom = '1px';
  controlText2.style.cssFloat = 'left';
  controlText2.innerHTML = 'Explore';
  
  var controlText = document.createElement('div');
  controlText.style.fontFamily = 'Arial,sans-serif';
  controlText.style.fontSize = '12px';
  controlText.style.borderStyle = 'solid';
  controlText.style.borderWidth = '1px';
  controlText.style.borderColor = 'gray transparent gray transparent';  
  controlText.style.backgroundColor = 'white';
  controlText.style.paddingLeft = '4px';
  controlText.style.paddingRight = '4px';
  controlText.style.paddingTop = '1px';
  controlText.style.paddingBottom = '1px';
  controlText.innerHTML = 'Learn';
  controlText.style.cssFloat = 'left';

  var controlText3 = document.createElement('div');
  controlText3.style.fontFamily = 'Arial,sans-serif';
  controlText3.style.fontSize = '12px';
  controlText3.style.borderStyle = 'solid';
  controlText3.style.borderWidth = '1px';
  controlText3.style.borderColor = 'gray gray gray gray';
  controlText3.style.backgroundColor = 'white';
  controlText3.style.paddingLeft = '4px';
  controlText3.style.paddingRight = '4px';
  controlText3.style.paddingTop = '1px';
  controlText3.style.paddingBottom = '1px';
  controlText3.style.cssFloat = 'left';
  controlText3.innerHTML = 'Maps';
  controlText3.style.color = 'gray';
  
  controlUI.appendChild(controlText2); 
  controlUI.appendChild(controlText);
  controlUI.appendChild(controlText3);  
  
  var self = this;

  // Setup the click event listeners
  google.maps.event.addDomListener(controlText, 'click', function() {
  	if(self.userpanel_) {
  		$( "#OutputPanelHolderContainer" ).hide('slide',{direction:'right'},'slow');
  		self.userpanel_ = false;
		controlText.style.color = 'black';
   } else {
  		$( "#OutputPanelHolderContainer" ).show('slide',{direction:'right'},'slow');
   		self.userpanel_ = true;
		controlText.style.color = 'gray';
   	}
  	});
  	
  google.maps.event.addDomListener(controlText2, 'click', function() {
  	if(self.inputUserPanel_) {
  		$( "#InputPanelHolderContainer" ).hide('slide',{direction:'left'},'slow');
  		self.inputUserPanel_ = false;
		controlText2.style.color = 'black';
   } else {
  		$( "#InputPanelHolderContainer" ).show('slide',{direction:'left'},'slow');
   		self.inputUserPanel_ = true;
		controlText2.style.color = 'gray';
   	}
  	});
  	
  google.maps.event.addDomListener(controlText3, 'click', function() {
		
		if(self.scenarioPane_) {
			$('#scenarioPanelVertical').hide('slide',{direction:'down'},'slow');
			self.scenarioPane_ = false;
			controlText3.style.color = 'black';
		} else {
			$('#scenarioPanelVertical').show('slide',{direction:'down'},'slow');
			self.scenarioPane_ = true;
			controlText3.style.color = 'gray';
		}
	});
};

/**
 * Draws the map for the explorer and adds the bindings. Options for the map
 * are taken from this.mapOptions().
 */
monsoon.maps.Map.prototype.drawMap = function() {
  var map = new google.maps.Map(document.getElementById('map_canvas'), this.mapOptions());
      
    var style = [
                 {
                 featureType: 'all',
                 elementType: 'all',
                 stylers: [
                           { saturation: 27 }
                           ]
                 },
                 {
                 featureType: 'road.highway',
                 elementType: 'all',
                 stylers: [
                           { visibility: 'off' }
                           ]
                 },
                 {
                 featureType: 'road.arterial',
                 elementType: 'all',
                 stylers: [
                           { visibility: 'off' }
                           ]
                 },
                 {
                 featureType: 'road.local',
                 elementType: 'all',
                 stylers: [
                           { visibility: 'off' }
                           ]
                 },
                 {
                 featureType: 'administrative.locality',
                 elementType: 'all',
                 stylers: [
                           { visibility: 'off' }
                           ]
                 },
                 {
                 featureType: 'administrative.neighborhood',
                 elementType: 'all',
                 stylers: [
                           { visibility: 'off' }
                           ]
                 },
                 {
                 featureType: 'administrative.land_parcel',
                 elementType: 'all',
                 stylers: [
                           { visibility: 'off' }
                           ]
                 },
                 {
                 featureType: 'poi',
                 elementType: 'all',
                 stylers: [
                           { visibility: 'off' }
                           ]
                 },
                 {
                 featureType: 'water',
                 elementType: 'all',
                 stylers: [
                           { visibility: 'simplified' }
                           ]
                 },
                 {
                 featureType: 'transit',
                 elementType: 'all',
                 stylers: [
                           { visibility: 'off' }
                           ]
                 }
                 ];
    
    var styledMapType = new google.maps.StyledMapType(style, {
                                                      map: map,
                                                      name: 'GLIGlobalMapStyle'
                                                      });
    map.mapTypes.set('GLIGlobalMapStyle', styledMapType);
    map.setMapTypeId('GLIGlobalMapStyle');
    
    this.map_ = map;

		// add one raster layer and create control panel    
    this.mapLayersControl = new monsoon.maps.LayerControl(map);

	 this.mapLayersControl.createRasterLayersFromJSON('js/data/GLIRasterLayer.json'); 

    var tileVctLayer = new monsoon.maps.TiledVectorMap(map, new google.maps.Size(256, 256));
    tileVctLayer.baseURL = 'js/data/';//"https://netfiles.umn.edu/users/sunx0170/GLI/Vector/AdminWorld/";
    tileVctLayer.layerIndex = 2;
    tileVctLayer.layerName = "Admin Boundaries";
    tileVctLayer.tooltip = new monsoon.maps.MapTooltip('map_canvas');
	 tileVctLayer.loadLayer();
    this.mapLayersControl.addRasterLayer(tileVctLayer);

    
    var vctLayer = new monsoon.maps.PolygonLayer(map);
    vctLayer.tooltip = new monsoon.maps.MapTooltip('map_canvas');
    vctLayer.layerName = "Country Yield";
	 vctLayer.loadLayer('js/data/world-low.json');//("https://netfiles.umn.edu/users/sunx0170/GLI/Vector/world-low.json");
	 this.mapLayersControl.addPolygonLayer(vctLayer);
    	 
	
    var tableId = monsoon.alpha.gli.DataModel.MAIZE_WORLD_MODEL_ID_;
        
	var query = "SELECT location, totalproduction FROM " + tableId;
	var encodedQuery = encodeURIComponent(query);
	
	var heatmapLayer = new monsoon.maps.GHeatmapLayer(map);
	heatmapLayer.layerName = "Heatmap";
	heatmapLayer.colors = monsoon.maps.Util.terrainGradient("#0000FF","FF0000","FFFF00",128);
	
	heatmapLayer.loadLayer(encodedQuery)	;
	
	this.lastWorldModelLayer_ = heatmapLayer.GLayer;
	
	this.mapLayersControl.addRasterLayer(heatmapLayer);
	
	var thematicLayer = new monsoon.maps.GThematicMapLayer(map);
	thematicLayer.layerName = 'Yield Gap';
	
	
	var countryListObj = goog.dom.getElement('countryList');
	var adminListObj = new monsoon.maps.GeogAdminList(countryListObj, "stateList");
	adminListObj.baseURL =  'js/data/'; //'https://netfiles.umn.edu/users/sunx0170/GLI/Vector/AdminWorld/';

	var tradeLinkLayer = new monsoon.maps.GeoTradeLinkLayer(map);
	tradeLinkLayer.layerName = 'Soybean Trade';
	tradeLinkLayer.tooltip = new monsoon.maps.MapTooltip('map_canvas');
	
	var tmpLoc = new google.maps.LatLng(40,-98);
	//var d3Test = new monsoon.maps.GMapS3Feature(tmpLoc, map, null,null, false);
	//d3Test.layerName = 'Imports of Soy';
	//d3Test.tooltip = new monsoon.maps.MapTooltip('map_canvas');
	
	var yieldGapMapsLayer =	new monsoon.maps.GeoRegionMap(map);
	yieldGapMapsLayer.layerName = "Yield Gap Modeled";
	var regionImgList = [];
	
	var callbackFunc = function() {
		thematicLayer.loadExampleLayer();
		tradeLinkLayer.loadGeogAdminList(adminListObj.countryList_);
		tradeLinkLayer.loadTradingRegionsList("js/data/tradingRegions.json", "United States");
		
		//d3Test.loadGeogAdminList(adminListObj.countryList_);
		//d3Test.loadTradingRegionsList("js/data/tradingRegions.json", "United States");
		
		yieldGapMapsLayer.loadGeogAdminList(adminListObj.countryList_);
		
		regionImgList.length = 0;
		regionImgList.push('USA_maize_gap_2000_2.png');
		regionImgList.push('USA_maize_gap_2000_5.png');
		for(var k = 10; k <= 90; k = k+10){
			regionImgList.push('USA_maize_gap_2000_' + k +'.png');		
		}
		
		regionImgList.push('USA_maize_gap_2000_98.png');
		regionImgList.push('USA_maize_gap_2000_95.png');
		yieldGapMapsLayer.loadRegionImages('USA','https://netfiles.umn.edu/users/sunx0170/GLI/Raster/yieldgap/CNTYS/', regionImgList);
	}

	this.mapLayersControl.addRasterLayer(tradeLinkLayer);
	
	//this.mapLayersControl.addRasterLayer(d3Test);
	
	this.mapLayersControl.addRasterLayer(yieldGapMapsLayer);
	
	//adminListObj.loadCountryList('countries.json', thematicLayer);
	//adminListObj.loadCountryListCrossDomain('countries.json', thematicLayer);
	adminListObj.loadCountryListCallback('countries.json', callbackFunc);
	this.mapLayersControl.addRasterLayer(thematicLayer);
	
	var self = this;
	var stepValsGap = [2,5,10,20,30,40,50,60,70,80,90,95,98];
	
   var sliderObj = $( '#yield_gap_slider' ).slider({
		orientation: 'horizontal',
		disabled: false, 
		animate: 'slow',
		range:'min',
		value:50,
		step:1,
		min:0,
		max:100,
		slide: function (event, ui) {
			thematicLayer.updateDataVal('', ui.value);

			yieldGapMapsLayer.updateImage(stepValsGap.indexOf(ui.value));			
			$( "#ay_amount" ).val( ui.value + "" );			
			
			if(map.getZoom() > 6) {
				self.applyManagement(0.01*(ui.value-50),0,0,0);
			}
		}
	 });
	 
	 $( "#ay_amount" ).val( "50" );

	 var layerControlTmp = this.mapLayersControl;
	 
	
	countryListObj.onchange = function () {
	
		adminListObj.loadStateList(countryListObj.options[countryListObj.selectedIndex].value);
		//adminListObj.loadStateListCrossDomain(countryListObj.options[countryListObj.selectedIndex].value);
		sliderObj.disabled = false;
		thematicLayer.currentActiveName = countryListObj.options[countryListObj.selectedIndex].value;
		thematicLayer.loadCountry(adminListObj.countryList_, thematicLayer.currentActiveName);
		var newVal = thematicLayer.getVisData();
		if(newVal >= 0) {
			sliderObj.slider('value',newVal);
		}
		
		tradeLinkLayer.loadOneRegionTradeData(countryListObj.options[countryListObj.selectedIndex].text);
	 	//d3Test.loadOneRegionTradeData(countryListObj.options[countryListObj.selectedIndex].text);	

		
		yieldGapMapsLayer.clearLayer();
		var cntyA3 = countryListObj.options[countryListObj.selectedIndex].value;

		regionImgList.length = 0;
		regionImgList.push(cntyA3+'_maize_gap_2000_2.png');
		regionImgList.push(cntyA3+'_maize_gap_2000_5.png');
		for(var k = 10; k <= 90; k = k+10){
			regionImgList.push(cntyA3 +'_maize_gap_2000_' + k +'.png');		
		}
		
		regionImgList.push(cntyA3 +'_maize_gap_2000_98.png');
		regionImgList.push(cntyA3 +'_maize_gap_2000_95.png');

		yieldGapMapsLayer.loadRegionImages(cntyA3,'https://netfiles.umn.edu/users/sunx0170/GLI/Raster/yieldgap/CNTYS/', regionImgList);
		
		layerControlTmp.updateAllLayerVisiblity();
	
	};
	
	// Create the DIV to hold the control and call the HomeControl() constructor
	// passing in this DIV.
	var userPanelDiv = document.createElement('div');
	var panelControl = new monsoon.maps.Map.prototype.UserPanelControl(userPanelDiv, map);

	userPanelDiv.index = 1;
	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(userPanelDiv);
	
	var progressBarDiv = document.createElement('div');
	  
	if(this.progressbar_) {
		this.progressbar_.resetPosition(progressBarDiv);
	} else {
	
	  var progressbar = new monsoon.maps.ProgressBar();

 	  progressbar.draw("map_main");	 

	  this.progressbar_ = progressbar;
	  this.progressbar_.resetPosition(progressBarDiv);
	}
	
	progressBarDiv.index = 1;
	map.controls[google.maps.ControlPosition.RIGHT].push(progressBarDiv);
	
	
	$( '#OutputPanelHolderContainer' ).hide();
	this.userpanel_ = false;
	
	this.mapSnapshotList_.createSnapshotsFromLayerControl(this.mapLayersControl);
		

	var scenarioPane = goog.dom.getElement('ScenarioPaneControl');
	scenarioPane.onclick = function () {
		$('#scenarioPanelVerticalB').toggle('slow');
	};

	var layerControlObj = this.mapLayersControl;
	var usaHolder = goog.dom.getElement('USAPlaceHolder');
	usaHolder.onclick = function () {
		
		if(map) {
			map.setZoom(5);
			map.panTo( new google.maps.LatLng(38, -97) );
			map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
			layerControlObj.updateChecked("Maize YieldBi", false);
			layerControlObj.updateChecked("Maize Yield", false);
		}
	};

	var amazonHolder = goog.dom.getElement('AmazonPlaceHolder');
	amazonHolder.onclick = function () {
		if(map) {
			map.setZoom(5);
			map.panTo( new google.maps.LatLng(-3, -60) );
			map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
			layerControlObj.updateChecked("Maize YieldBi", false);
			layerControlObj.updateChecked("Maize Yield", false);
		}
	};
	
    this.mapLayersControl.createControlPanel("layerControlMenu");

	google.maps.event.addListener(map, 'center_changed',
	  goog.bind(this.mapChanged, this));

	google.maps.event.addListener(map, 'zoom_changed',
	  goog.bind(this.mapChanged, this));
	  
	google.maps.event.addListener(map, 'tilesloaded',
	  goog.bind(this.tilesLoaded, this));	  
	
	this.createLocationSearch();
};


// Normalizes the coords that tiles repeat across the x axis (horizontally)
// like the standard Google map tiles.

monsoon.maps.Map.prototype.normalizCoord = function(coord, zoom) {

/*	
	var projection = mapObj.getProjection();
	
  	// tile range in one direction range is dependent on zoom level
  	// 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
	var numTiles = 1 << mapObj.getZoom();

	var worldCoordinate = coord;
	
	var latLngCoord = projection.fromPointToLatLng(coord, false);
	
	//var xTile = Math.floor((latLngCoord.x + 180.0) / (180.0/numTiles));
	//var yTile = Math.floor((90.0 - latLngCoord.y ) / (90.0/numTiles));  
	
	
   var pixelCoordinate = new google.maps.Point(
         worldCoordinate.x * numTiles,
         worldCoordinate.y * numTiles);
            
   var tileCoordinate = new google.maps.Point(
         Math.floor(pixelCoordinate.x / 256),
         Math.floor(pixelCoordinate.y / 256));
         
   //tileCoordinate = coord;
	return tileCoordinate.x + "/" + tileCoordinate.y;  
  
	//return xTile + "/" + yTile;
*/
  var y = coord.y;
  var x = coord.x;

  // tile range in one direction range is dependent on zoom level
  // 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
  var tileRange = 1 << zoom;

  // don't repeat across y-axis (vertically)
  if (y < 0 || y >= tileRange) {
    return null;
  }

  // repeat across x-axis
  if (x < 0 || x >= tileRange) {
    x = (x % tileRange + tileRange) % tileRange;
  }

  return {
    x: x,
    y: y
  };

};


/**
 * Draws a map according to data passed in.
 * @param {Object} mapData Content of a table to be displayed on the map.
 * @param {Object} layer Description of the layer.
 */
monsoon.maps.Map.prototype.showMap = function(mapData, layer) {
  // Enumerate explicitly known display types to catch errors
  if (!this.map_) {
    this.drawMap();
  }

  this.parseLayerData(mapData, layer);
};


/**
 * Starts XHR to receive data to be displayed on a map.
 */
monsoon.maps.Map.prototype.loadMap = function() {
  var center = this.mapCenter_;

  // Ideally we would get this info from the map object but this object
  // takes a long time to be created and we want to issue the request for
  // data from our server in parallel with the process of creation of the map.
  // It may be possible to calculate this size accurately as a function of
  // the size of the maps in pixels and the zoom level.
  var sizeLat = monsoon.maps.Map.DEFAULT_SIZE_REQUEST_LAT_;
  var sizeLon = monsoon.maps.Map.DEFAULT_SIZE_REQUEST_LNG_;

  var sw = new google.maps.LatLng(center.lat() - sizeLat / 2,
      center.lng() - sizeLon / 2);
  var ne = new google.maps.LatLng(center.lat() + sizeLat / 2,
      center.lng() + sizeLon / 2);

  this.dataBounds_ = new google.maps.LatLngBounds(sw, ne);

  this.numDataRequests_ = 0;

  var boundFunction = goog.bind(this.handleGetDataRequest, this);
  this.getDataForActiveLayers(this.dataBounds_, boundFunction, false);
};


/**
 * Creates and configures the search bar for locations with autocomplete.
 */
monsoon.maps.Map.prototype.createLocationSearch = function() {
  var map = this.map_;
  var input = goog.dom.getElement('search_location');

  var options = {
    types: ['geocode']
  };

  var autocomplete = new google.maps.places.Autocomplete(input, options);
  autocomplete.bindTo('bounds', map);

  google.maps.event.addListener(
      autocomplete,
      'place_changed',
      goog.bind(this.handleLocationSearch_, this, autocomplete));
};


/**
 * Callback when the user uses the location search autocomplete.
 * @param {google.maps.places.Autocomplete} autocomplete The autocomplete box.
 * @private
 */
monsoon.maps.Map.prototype.handleLocationSearch_ = function(autocomplete) {
  var place = autocomplete.getPlace();
  this.map_.setCenter(place.geometry.location);
  this.mapChanged();
};


/**
 * Callback when the user mouses over a cell to show cell details for debug.
 * @param {google.maps.MVCObject} cell The cell that the mouse is hovered over.
 * @private
 */
monsoon.maps.Map.prototype.cellDebugOn_ = function(cell) {
  var tile = cell.tile;
  this.updateDebug_(tile);
};


/**
 * Callback when the mouse leaves the hovered cell to reset debug details.
 * @private
 */
monsoon.maps.Map.prototype.cellDebugOff_ = function() {
  var debugElement = goog.dom.getElement('tile_debug');
  goog.dom.setTextContent(debugElement, 'No Tile Selected');
};


/**
 * Called to update tile information for debugging on mouseover.
 * @param {monsoon.maps.Tile} tile The tile of the cell that is selected.
 * @private
 */
monsoon.maps.Map.prototype.updateDebug_ = function(tile) {
  // Display debugging info.
  var debugElement = goog.dom.getElement('tile_debug');
  var tileInfo = 'Selected Tile @' + tile.lat + ',' + tile.lng + '=' +
      tile.value + ', key: ' + tile.getKey();

  if (tile.cell.fillColor) {
    tileInfo += ', color: ' + tile.cell.fillColor;
  }

  goog.dom.setTextContent(debugElement, tileInfo);
};


/**
 * Sets active layers.
 */
monsoon.maps.Map.prototype.setActiveLayers = goog.abstractMethod;

monsoon.maps.Map.prototype.applyManagement = goog.abstractMethod;


/**
 * Creates the sidebar.
 * <p>
 * This is only done once, so constructed objects live for
 * the lifetime of the page.
 */
monsoon.maps.Map.prototype.createSidebar = goog.abstractMethod;


/**
 * Creates the display bar which displays output from the scenario exploration.
 * <p>
 * This is only done once, so constructed objects live for
 * the lifetime of the page.
 */
monsoon.maps.Map.prototype.createDisplaybar = goog.abstractMethod;


/**
 * Creates a shape with the given options.
 * @param {!monsoon.maps.CellInfo} cellInfo The information needed
 *     to create the cell.
 * @return {!google.maps.MVCObject} A shape for this grid cell.
 */
monsoon.maps.Map.prototype.createCell = goog.abstractMethod;


/**
 * Creates a marker with a given text as a tooltip.
 * @param {!monsoon.maps.PointInfo} pointInfo The information needed to create
 *   the maker and tooltip.
 * @return {!google.maps.Marker} Marker for this location.
 */
monsoon.maps.Map.prototype.createPoint = goog.abstractMethod;

monsoon.maps.Map.prototype.createSquares = goog.abstractMethod;


/**
 * Updates the existing shape using the supplied cell information.
 * @param {!monsoon.maps.CellInfo} cellInfo The information needed
 *     to update the cell.
 */
monsoon.maps.Map.prototype.updateCell = goog.abstractMethod;


/**
 * Displays an info window to be used as a tooltip.
 * @param {google.maps.MVCObject} cell The cell that triggers the info window.
 */
monsoon.maps.Map.prototype.displayInfoWindow = function(cell) {
  var location = cell.tile.getLocation();

  // calculate anchor offset for gridded cells
  if (cell.latOffset && cell.lngOffset) {
    location = monsoon.maps.Util.translateLatLng(
        location, cell.latOffset, cell.lngOffset);
  }

  var options = {
      content: this.createInfoWindowContent(cell),
      position: location
  };

  if (!this.infoWindow_) {
    this.infoWindow_ = new google.maps.InfoWindow();
  }

  this.infoWindow_.setOptions(options);
  this.infoWindow_.open(this.map_);
};


/**
 * Creates a DOM element for display within the {google.maps.InfoWindow}.
 * @param {google.maps.MVCObject} cell The cell the InfoWindow will point to.
 * @return {Element} The DOM element to be displayed.
 */
monsoon.maps.Map.prototype.createInfoWindowContent = goog.abstractMethod;


/**
 * Callback when some map data has been changed.
 */
monsoon.maps.Map.prototype.dataChanged = goog.abstractMethod;


/**
 * Callback when the map has been changed.
 */
monsoon.maps.Map.prototype.notifyMapChanged = goog.abstractMethod;


/**
 * Returns current state of the UI.
 * @return {!Object} Current state of the UI.
 */
monsoon.maps.Map.prototype.getCurrentState = function() {
  var map = this.map_;
  if (!map) {
    return {};
  }
  var result = {
    'lat': map.getCenter().lat(),
    'lng': map.getCenter().lng(),
    'zoom': map.getZoom()};
  return result;
};


/**
 * Sets state of the UI from the parameter.
 * @param {Object} state New state of the UI.
 */
monsoon.maps.Map.prototype.setCurrentState = function(state) {
  if (!state) {
    return;
  }
  this.mapCenter_ = new google.maps.LatLng(state.lat, state.lng);
  this.mapOptions_.center = this.mapCenter_;
  this.mapOptions_.zoom = state.zoom;
};

monsoon.maps.Map.prototype.updateProgressBar = function() {
	var progressbar = this.progrressbar_;

	if(progressbar && this.dbBridge.getRequestCount() > this.dbBridge.getResponseCount()) {
		progressbar.setCurrent(this.dbBridge.getResponseCount());
	} else {
		progressbar.hide();
	}
	
}

