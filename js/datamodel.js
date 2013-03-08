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
 * @fileoverview The data model used for the GLI application.
 * @author Donn Denman
 */

goog.provide('monsoon.alpha.gli.CropInfo');
goog.provide('monsoon.alpha.gli.DataModel');

goog.require('monsoon.maps.MapLayer');
goog.require('monsoon.maps.MapLayerComputeInfo');
goog.require('monsoon.maps.Util');



/**
 * This class manages crop-related data for the GLI application.
 * <p>
 * This class knows specifics about how crop data is stored and how to request
 * specific kinds of crop data, but does not do any manipulation or
 * interpretation of the data it manages.  All agricultural code should
 * be in {@link monsoon.alpha.gli.CropModel} instead of this class.
 * <p>
 * Two kinds of data are managed:  layer data and column data.
 * Layer data is managed through a set of named
 * layers of type {@link monsoon.maps.MapLayer}, and requests are made to
 * a callback function in order to load new data when needed.
 * Column data is simply loaded through the {@link monsoon.maps.DbBridge}
 * into private members accessed through a few public methods.
 * @param {function(monsoon.maps.MapLayer, monsoon.maps.MapLayer)}
 *     replaceMapLayerFunction The function to call to replace map layers
 *     on the map.
 * @param {!monsoon.maps.DbBridge} dbBridge The database bridge to use when
 *     requesting column data.
 * @constructor
 */
monsoon.alpha.gli.DataModel = function(replaceMapLayerFunction, dbBridge) {
  /**
   * The list of crops and their attributes available to the user.
   * @type {!Object}
   * @private
   */
  this.crops_ = this.buildCropTable_();

  /**
   * Object containing named {@link monsoon.maps.MapLayer} properties.
   * @type {!Object}
   * @private
   */
  this.layers_ = {};

  /**
   * Climate bin definitions are cached here.
   * @type {!Array}
   * @private
   */
  this.climateBins_ = [];

  /**
   * Yield model data are cached here.
   * @type {!Array}
   * @private
   */
  this.yieldModel_ = [];

  /**
   * The database bridge to use when requesting column data.
   * @type {!monsoon.maps.DbBridge}
   * @private
   */
  this.dbBridge_ = dbBridge;

  /**
   * The function to call to replace a map layer.
   * <p>
   * Typically this points to
   * {@code monsoon.maps.Map.prototype.replaceMapLayer}.
   * @type {function(monsoon.maps.MapLayer, monsoon.maps.MapLayer)}
   * @private
   */
  this.replaceMapLayerFunction_ = replaceMapLayerFunction;

  // Make initial data requests.
  this.requestInitialData_();
};


/**
 * Precipitation table ID.
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.gli.DataModel.PRECIP_TABLE_ID_ = 'umn.Precip';


/**
 * Precipitation field from the precipitation table.
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.gli.DataModel.PRECIP_FIELD_ = 'precip';


/**
 * Table ID for the GDD table.
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.gli.DataModel.GDD_TABLE_ID_ = 'umn.GDD_v3';


/**
 * Prefix for the GDD fields.  An integer follows the 'GDD'.
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.gli.DataModel.GDD_FIELD_PREFIX_ = 'GDD';


/**
 * Index minimum for the GDD fields.
 * @type {number}
 * @private
 * @const
 */
monsoon.alpha.gli.DataModel.GDD_FIELD_INDEX_MIN_ = 0;


/**
 * Index maximum for the GDD fields.
 * @type {number}
 * @private
 * @const
 */
monsoon.alpha.gli.DataModel.GDD_FIELD_INDEX_MAX_ = 12;


/**
 * Climate definitions table, in BQ.
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.gli.DataModel.CLIMATE_DEFS_TABLE_ID_ =
    'umn.Crop_Climate_Defs';


/**
 * Fields that we need from the climate definitions table.
 * @type {string}
 * @private
 */
monsoon.alpha.gli.DataModel.CLIMATE_DEFS_FIELDS_ = [
  'bin_number',
  'gdd_min_temp_c',
  'gdd_max_temp_c',
  'precip_min_mm',
  'precip_max_mm',
  'potential_yield_tons_per_ha',
  'crop_name'
];


/**
 * Indices for the climate bin fields in
 * monsoon.alpha.gli.DataModel.CLIMATE_DEFS_FIELDS_.
 * @enum {number}
 * @private
 */
monsoon.alpha.gli.DataModel.ClimateDefsFieldIndices_ = {
  BIN_NUMBER: 0,
  GDD_MIN_TEMP_C: 1,
  GDD_MAX_TEMP_C: 2,
  PRECIP_MIN_MM: 3,
  PRECIP_MAX_MM: 4,
  POTENTIAL_YIELD_TONS_PER_HA: 5,
  CROP_NAME: 6
};


/**
 * Yield model table, in BQ.
 * Currently this table is for maize only.
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.gli.DataModel.YIELD_MODEL_MAIZE_TABLE_ID_ =
    'umn.yield_model_maize';


/**
 * Fields that we need from the yield model table.
 * @type {string}
 * @private
 */
monsoon.alpha.gli.DataModel.YIELD_MODEL_FIELDS_ = [
  'climate_bin',
  'gdd_min_temp_c,gdd_max_temp_c',
  'precip_min_mm,precip_max_mm',
  'potential_yield_tons_per_ha',
  'minimum_yield_tons_per_ha',
  'b_nut',
  'c_N',
  'c_P2O5',
  'c_K2O',
  'b_irr',
  'c_irr',
  'bin_rmse',
  'bin_r2'
];


/**
 * Limit on the number of items to return when getting climate definitions.
 * @type {number}
 * @const
 * @private
 */
monsoon.alpha.gli.DataModel.CLIMATE_DEFS_REQUEST_LIMIT_ = 30000;


/**
 * The world-model ID to use for maize.
 * Currently just a Fusion Table ID number.
 * https://www.google.com/fusiontables/DataSource?dsrcid=2180269
 * @type {number}
 * @const
 * @private
 */
monsoon.alpha.gli.DataModel.MAIZE_WORLD_MODEL_ID_ = "1wFNsE6pkAC81krU92TvAmgwWGO21CFDd2JhQkS4";


/**
 * The world-model ID to use for cereals.
 * Currently just a Fusion Table ID number.
 * @type {number}
 * @const
 * @private
 */
monsoon.alpha.gli.DataModel.CEREALS_WORLD_MODEL_ID_ = 2121174;


/**
 * An array of available crops and their details.
 * TODO: make this a separate class built dynamically from
 * available data from the DB.
 * This includes getting GDD values from the crop details table.
 * @type {Object}
 * @private
 * @const
 */
monsoon.alpha.gli.DataModel.CROP_TABLE_ = {
  cereals: {
    TABLE: 'umn.All_Cropgroups',
    YIELD_FIELD: 'Cereals_yield',
    AREA_FIELD: 'Cereals_area',
    // TODO: get these GDD_BASE values from the crop details table
    GDD_BASE: 0,
    CROP_ID: 'cerealnes',
    YEARS: [2000],
    WORLD_MODEL_ID: monsoon.alpha.gli.DataModel.CEREALS_WORLD_MODEL_ID_
  },
  fiber: {
    TABLE: 'umn.All_Cropgroups',
    YIELD_FIELD: 'Fiber_yield',
    AREA_FIELD: 'Fiber_area',
    GDD_BASE: 0,
    CROP_ID: 'fibrenes',
    YEARS: [2000]
  },
  fruit: {
    TABLE: 'umn.All_Cropgroups',
    YIELD_FIELD: 'Fruit_yield',
    AREA_FIELD: 'Fruit_area',
    GDD_BASE: 0,
    CROP_ID: 'fruitnes',
    YEARS: [2000]
  },
  treenuts: {
    TABLE: 'umn.All_Cropgroups',
    YIELD_FIELD: 'Treenuts_yield',
    AREA_FIELD: 'Treenuts_area',
    GDD_BASE: 0,
    CROP_ID: 'nutnes',
    YEARS: [2000]
  },
  vegetables: {
    TABLE: 'umn.All_Cropgroups',
    YIELD_FIELD: 'Treenuts_yield',
    AREA_FIELD: 'Treenuts_area',
    GDD_BASE: 0,
    CROP_ID: 'vegetablenes',
    YEARS: [2000]
  },
  maize: {
    TABLE: 'umn.Crops_2005',
    YIELD_FIELD: 'maize_yield',
    AREA_FIELD: 'maize_area',
    GDD_BASE: 8,
    CROP_ID: 'maize',
    YEARS: [2005],
    NPKI_TABLE: 'umn.npki',
    NPKI_FIELDS: ['maizeN', 'maizeP2O5', 'maizeK2O', 'maizeI'],
    WORLD_MODEL_ID: monsoon.alpha.gli.DataModel.MAIZE_WORLD_MODEL_ID_
  },
  quince: {
    TABLE: 'umn.Crops_Q',
    YIELD_FIELD: 'quince_yield',
    AREA_FIELD: 'quince_area',
    GDD_BASE: 0,
    CROP_ID: 'quince',
    YEARS: [2000]
  },
  quinoa: {
    TABLE: 'umn.Crops_Q',
    YIELD_FIELD: 'quinoa_yield',
    AREA_FIELD: 'quinoa_area',
    GDD_BASE: 2,
    CROP_ID: 'quinoa',
    YEARS: [2000]
  },
  rice: {
    TABLE: 'umn.Crops_2005',
    YIELD_FIELD: 'rice_yield',
    AREA_FIELD: 'rice_area',
    GDD_BASE: 5,
    CROP_ID: 'rice',
    YEARS: [2005]
  },
  wheat: {
    TABLE: 'umn.Crops_2005',
    YIELD_FIELD: 'wheat_yield',
    AREA_FIELD: 'wheat_area',
    GDD_BASE: 0,
    CROP_ID: 'wheat',
    YEARS: [2005]
  }
};


/**
 * Builds the crop table based on available data.
 * @return {Object} the crop table.
 * @private
 */
monsoon.alpha.gli.DataModel.prototype.buildCropTable_ = function() {
  // TODO: build the crop table from various data from the DB.
  return monsoon.alpha.gli.DataModel.CROP_TABLE_;
};


/**
 * Gets the names of all the available crops that we have data for.
 * @return {Array.<string>} The list of crop names.
 */
monsoon.alpha.gli.DataModel.prototype.getCropNames = function() {
  var names = [];
  for (var cropName in this.crops_) {
    names.push(cropName);
  }
  return names;
};


/**
 * Creates a precipitation layer.
 * @return {!monsoon.maps.MapLayer} A new precipitation layer.
 */
monsoon.alpha.gli.DataModel.prototype.makePrecipLayer = function() {
  var table = monsoon.alpha.gli.DataModel.PRECIP_TABLE_ID_;
  var field = monsoon.alpha.gli.DataModel.PRECIP_FIELD_;
  return new monsoon.maps.MapLayer(
      table, field, monsoon.maps.MapLayer.Display.HIDDEN);
};


/**
 * Creates and returns a new gdd (temperature) layer, based on the
 * crop and temperature provided.
 * <p>
 * Note that there is no check that the input temperature is
 * within the range of available field indices.
 * @param {string} cropName The name of the crop .
 * @param {number} temperature The temperature for the new layer.
 * @return {!monsoon.maps.MapLayer} the created layer.
 */
monsoon.alpha.gli.DataModel.prototype.makeGddLayer = function(
    cropName, temperature) {
  var gddIndex = this.getGddIndex_(cropName, temperature);
  var field = this.makeGddFieldName_(gddIndex);
  var table = monsoon.alpha.gli.DataModel.GDD_TABLE_ID_;
  return new monsoon.maps.MapLayer(
      table, field, monsoon.maps.MapLayer.Display.HIDDEN);
};


/**
 * Replaces the named layer with a newly created layer.  The new layer
 * will be based on data from the database using the table and field selectors
 * provided.
 * @param {string} layerName The name of the layer to replace.
 * @param {string} table The name of the database table to use for the
 *     new layer.
 * @param {string} field The name of the database field to use for the
 *     new layer.
 */
monsoon.alpha.gli.DataModel.prototype.replaceDbLayer = function(
      layerName, table, field) {
  var display = monsoon.maps.MapLayer.Display.HIDDEN;
  var newLayer = new monsoon.maps.MapLayer(table, field, display);
  this.replaceLayer(layerName, newLayer);
};


/**
 * Replaces the named computed layer.
 * <p>
 * If there is no base layer provided, then there will be no new computed layer
 * created, and the previously existing computed layer by the same name
 * will simply be removed.
 * @param {string} layerName The name of the layer to replace.
 * @param {monsoon.maps.MapLayer} baseLayer The base layer this new layer
 *     is based on, or {@code null} if we're just removing the existing layer.
 */
monsoon.alpha.gli.DataModel.prototype.replaceComputedLayer = function(
    layerName, baseLayer) {
  var newLayer = null;
  if (baseLayer) {
    var layerComputeInfo = new monsoon.maps.MapLayerComputeInfo(
        layerName, baseLayer);
    var display = monsoon.maps.MapLayer.Display.HIDDEN;
    newLayer = new monsoon.maps.MapLayer(null, null, display, layerComputeInfo);
  }
  this.replaceLayer(layerName, newLayer);
};


/**
 * Replaces the named layer with the given layer.
 * @param {string} layerName The name of the layer to replace.
 * @param {monsoon.maps.MapLayer} newLayer The new layer to use.
 */
monsoon.alpha.gli.DataModel.prototype.replaceLayer = function(
    layerName, newLayer) {
  var oldLayer = this.layers_[layerName];
  // Don't load a new layer if old and new are equal (according to MapLayer).
  if (newLayer == null || !newLayer.equals(oldLayer)) {
    // TODO: change this callback function into an event?
    this.replaceMapLayerFunction_(oldLayer, newLayer);
    this.layers_[layerName] = newLayer;
  }
};


/**
 * Gets the layers object.
 * @return {!Object} An object whose properties are the map layers.
 */
monsoon.alpha.gli.DataModel.prototype.getLayers = function() {
  return this.layers_;
};


/**
 * Gets the names of all the layers in the data model.
 * @return {!Array.<string>} The layer names.
 */
monsoon.alpha.gli.DataModel.prototype.getLayerNames = function() {
  var names = [];
  for (var layer in this.layers_) {
    names.push(layer);
  }
  return names;
};


/**
 * Gets the specified layer.
 * @param {string} layerName The name of the layer to get.
 * @return {monsoon.maps.MapLayer} The map layer, or {@code undefined} if
 *     it does not exist.
 */
monsoon.alpha.gli.DataModel.prototype.getLayer = function(layerName) {
  return this.layers_[layerName];
};


/**
 * Gets the field name of a GDD layer associated with a gdd index.
 * @param {number} gddIndex The index to use to generate the field name.
 * @return {string} The field name for that index.
 * @private
 */
monsoon.alpha.gli.DataModel.prototype.makeGddFieldName_ = function(
    gddIndex) {
  return monsoon.alpha.gli.DataModel.GDD_FIELD_PREFIX_ +
      String(gddIndex);
};


/**
 * Gets the GDD (Growing Degree Days) field index for the given
 * temperature.
 * <p>
 * Note that there is no check that the input temperature is
 * within the range of available field indices.
 * @param {string} cropName The crop name whose GDD index we want.
 * @param {number} temperature The temperature whose field index we want.
 * @return {number} The index for the field that has the GDD for this
 *     temperature for the current active crop.
 * @private
 */
monsoon.alpha.gli.DataModel.prototype.getGddIndex_ = function(
    cropName, temperature) {
  var cropData = this.crops_[cropName];
  var cropBaseTemp = cropData.GDD_BASE;
  return cropBaseTemp - temperature;
};


/**
 * Checks if the scenario parameters are within a reasonable range.
 * @param {!monsoon.alpha.gli.ModelControls} modelControls The controls
 *     for the model that need to be checked for sanity.
 * @return {string} A message describing what's unreasonable, or {@code null}
 *     to indicate sanity.
 */
monsoon.alpha.gli.DataModel.prototype.checkScenarioSanity = function(
    modelControls) {
  if (isNaN(modelControls.tempChange)) {
    return 'Temperature change is not a number!';
  }
  if (isNaN(modelControls.precipChange)) {
    return 'Can\'t parse precipitation change!';
  }
  var gddIndex = this.getGddIndex_(
      modelControls.crop, modelControls.tempChange);
  if (gddIndex < monsoon.alpha.gli.DataModel.GDD_FIELD_INDEX_MIN_ ||
      gddIndex > monsoon.alpha.gli.DataModel.GDD_FIELD_INDEX_MAX_) {
    return 'Temperature change out of range!';
  }
  return null;
};


/**
 * Gets the crop info for the specified crop.
 * @param {string} cropName The name of the crop to get info for.
 * @return {!monsoon.alpha.gli.CropInfo} The crop information object.
 */
monsoon.alpha.gli.DataModel.prototype.getCropInfo = function(cropName) {
  var info = this.crops_[cropName];
  return new monsoon.alpha.gli.CropInfo(
      info.TABLE,
      info.YIELD_FIELD,
      info.AREA_FIELD,
      info.GDD_BASE,
      info.CROP_ID,
      info.YEARS,
      info.NPKI_TABLE,
      info.NPKI_FIELDS,
      info.WORLD_MODEL_ID);
};


/**
 * Gets a tile from a layer of map data.
 * @param {google.maps.LatLng} location The location to get the tile from.
 * @param {string} layerName The name of the layer to get the tile from.
 * @return {?monsoon.maps.Tile} the tile from the specified location in the
 *     layer, or {@code null} if there is no tile at that location, or no layer.
 * @private
 */
monsoon.alpha.gli.DataModel.prototype.getLayerTile_ = function(
    location, layerName) {
  var layer = this.layers_[layerName];
  if (layer) {
    return layer.getTile(location.lat(), location.lng());
  }
  return null;
};


/**
 * Gets a value from a layer of map data.
 * @param {google.maps.LatLng} location The location to read data from.
 * @param {string} layerName The name of the layer to read data from.
 * @return {?number} the value read from the specified location in the layer,
 *     or {@code null} if there is no data available.
 */
monsoon.alpha.gli.DataModel.prototype.getLayerValue = function(
    location, layerName) {
  var tile = this.getLayerTile_(location, layerName);
  if (tile) {
    return tile.value;
  }
  return null;
};


/**
 * Sets the value in the named layer at the given location.
 * <p>
 * If there is no layer defined with the given layer name, then nothing is done.
 * @param {google.maps.LatLng} location The location to set data for.
 * @param {string} layerName The name of the layer to set data in.
 * @param {number} value The value to set.
 */
monsoon.alpha.gli.DataModel.prototype.setLayerValue = function(
    location, layerName, value) {
  var layer = this.layers_[layerName];
  if (layer) {
    var tile = this.getLayerTile_(location, layerName);
    if (tile) {
      tile.value = value;
    } else {
      tile = new monsoon.maps.Tile(location.lat(), location.lng(), value, null);
      this.layers_[layerName].setTile(tile);
    }
  }
};


/**
 * Makes initial data requests for everything we know we'll need.
 * @private
 */
monsoon.alpha.gli.DataModel.prototype.requestInitialData_ = function() {
  this.requestClimateDefs_();
  this.requestYieldModel_();
};


/**
 * Requests the yield-model data table.
 * TODO: read model data for other crops besides maize.
 * @private
 */
monsoon.alpha.gli.DataModel.prototype.requestYieldModel_ = function() {
  var fields = monsoon.alpha.gli.DataModel.YIELD_MODEL_FIELDS_;
  var table = monsoon.alpha.gli.DataModel.YIELD_MODEL_MAIZE_TABLE_ID_;
  var assign = goog.bind(
    function(payload) {
      this.yieldModel_ = payload;
    },
    this);
  this.requestColumnData_(table, fields, assign);
};


/**
 * Gets the yield model data array for maize.
 * @return {!Array} The yield model data for maize.
 */
monsoon.alpha.gli.DataModel.prototype.getYieldModelMaize = function() {
  return this.yieldModel_;
};


/**
 * Requests the climate bin definitions table.
 * @private
 */
monsoon.alpha.gli.DataModel.prototype.requestClimateDefs_ = function() {
  var fields = monsoon.alpha.gli.DataModel.CLIMATE_DEFS_FIELDS_;
  var table = monsoon.alpha.gli.DataModel.CLIMATE_DEFS_TABLE_ID_;
  var assign = goog.bind(
    function(payload) {
      this.climateBins_ = payload;
    },
    this);
  var limit = monsoon.alpha.gli.DataModel.CLIMATE_DEFS_REQUEST_LIMIT_;
  this.requestColumnData_(table, fields, assign, limit);
};


/**
 * Requests column data from the db bridge and calls the specified callback
 * with the resulting payload.
 * @param {string} table The name of the db table to read from.
 * @param {Array.<string>} fields The names of the db columns to read from.
 * @param {function(Array.<number|string>)} callback The callback to call
 *     with the array data from the response payload.
 * @param {number=} opt_limit Optional limit to the number of items to return.
 * @private
 */
monsoon.alpha.gli.DataModel.prototype.requestColumnData_ = function(
    table, fields, callback, opt_limit) {
  var wrapper = function(response) {
    var payload = response['payload'];
    if (payload && payload.length > 0) {
      callback(payload);
    } else {
      throw Error('No data in response from request.');
    }
  };
  this.dbBridge_.requestColumnData(table, fields, wrapper, opt_limit);
};


/**
 * Finds the climate bin given the crop, precipitation and GDD.
 * @param {string} cropId The crop whose climate bin we're looking for.
 * @param {number} precip Integer with the precipitation target.
 * @param {number} gdd Real with the GDD target.
 * @return {?number} The bin number as an integer,
 *     or {@code null} if the bin is not found.
 */
monsoon.alpha.gli.DataModel.prototype.findClimateBin = function(
    cropId, precip, gdd) {
  if (this.climateBins_) {
    var bins = this.climateBins_;
    var indices = monsoon.alpha.gli.DataModel.ClimateDefsFieldIndices_;
    for (var i = 0, bin; bin = bins[i]; i++) {
      var g_min = bin[indices.GDD_MIN_TEMP_C];
      var g_max = bin[indices.GDD_MAX_TEMP_C];
      var p_min = bin[indices.PRECIP_MIN_MM];
      var p_max = bin[indices.PRECIP_MAX_MM];
      if (bin[indices.CROP_NAME] == cropId) {
        if (p_min <= precip && precip <= p_max &&
            g_min <= gdd && gdd <= g_max) {
          // found!
          return bin[indices.BIN_NUMBER];
        }
      }
    }
  }
  return null;
};


/**
 * Finds the potential yield value for a crop and climate bin.
 * @param {string} cropId The crop whose potential yield we're looking for.
 * @param {number} binTarget The bin whose yield we want.
 * @return {?number} Potential yield, or or {@code null} if not found.
 */
monsoon.alpha.gli.DataModel.prototype.findPotentialYield = function(
    cropId, binTarget) {
  if (this.climateBins_) {
    var bins = this.climateBins_;
    var indices = monsoon.alpha.gli.DataModel.ClimateDefsFieldIndices_;
    for (var i = 0, bin; bin = bins[i]; i++) {
      var binNumber = bin[indices.BIN_NUMBER];
      if (bin[indices.CROP_NAME] == cropId && binNumber == binTarget) {
        // found!
        return bin[indices.POTENTIAL_YIELD_TONS_PER_HA];
      }
    }
  }
  return null;
};


/**
 * Sets up the climate bins, for testing purposes.
 * @param {Array} climateBins The bins to use.
 */
monsoon.alpha.gli.DataModel.prototype.setClimateBins = function(climateBins) {
  this.climateBins_ = climateBins;
};



/**
 * Encapsulates the database-related information for a specific crop.
 * @param {string} table The table ID of the database table for this crop.
 * @param {string} yieldField The name of the field in the table that
 *     contains crop yield information.
 * @param {string} areaField The name of the field in the table that
 *     contains crop area-under-culativation information.
 * @param {number} baseGdd The base gdd for this crop.
 * @param {string} cropId The internal crop identifier used within data
 *     tables to reference this crop.
 * @param {Array/<number>} years A list of all the years in which we have
 *     data for this crop.
 * @param {string=} opt_npkiTable Optional table name for NPKI data.
 * @param {Array.<string>=} opt_npkiFields Optional list of DB fields for
 *     NPKI data.
 * @param {number=} opt_worldModelId Optional world-model ID.
 * @constructor
 */
monsoon.alpha.gli.CropInfo = function(
    table,
    yieldField,
    areaField,
    baseGdd,
    cropId,
    years,
    opt_npkiTable,
    opt_npkiFields,
    opt_worldModelId) {
  /**
   * The table ID of the database table for this crop.
   * @type {string}
   */
  this.table = table;

  /**
   * The name of the field in the table that contains crop yield information.
   * @type {string}
   */
  this.yieldField = yieldField;

  /**
   * The name of the field that contains crop area-under-culativation
   * information.
   * @type {string}
   */
  this.areaField = areaField;

  /**
   * The base gdd (Growing Degree Days) for this crop.
   * @type {number}
   */
  this.baseGdd = baseGdd;

  /**
   * The internal crop identifier used within data tables to reference
   * this crop.
   * @type {string}
   */
  this.cropId = cropId;

  /**
   * A list of all the years in which we have data for this crop.
   * @type {string}
   */
  this.years = years;

  /**
   * The name of the table to get NPKI management info from.
   * @type {?string}
   */
  this.npkiTable = opt_npkiTable;

  /**
   * The names of the fields that contain NPKI management info.
   * @type {Array.<string>}
   */
  this.npkiFields = opt_npkiFields;

  /**
   * The ID for a world-model to show when in WORLD granularity view.
   * If {@code 0}, show nothing.
   * @type {number}
   */
  this.worldModelId = opt_worldModelId || 0;
};


/**
 * Gets the table name of the given management component.
 * @return {?string} The table name.
 */
monsoon.alpha.gli.CropInfo.prototype.getTableName = function() {
  return this.npkiTable;
};


/**
 * Gets the field name of the given management component.
 * @param {!monsoon.alpha.gli.MgmtInputs.MgmtComponent} mgmtComponent The
 *     component whose field name we want (N, P, K or I).
 * @return {?string} The field name.
 */
monsoon.alpha.gli.CropInfo.prototype.getFieldName = function(mgmtComponent) {
  if (!this.npkiFields) {
    return null;
  }
  return this.npkiFields[mgmtComponent];
};
