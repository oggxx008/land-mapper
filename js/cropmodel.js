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
 * @fileoverview The crop model used for the GLI application.
 * @author Donn Denman
 */

goog.provide('monsoon.alpha.gli.CropModel');

goog.require('monsoon.alpha.gli.CropDatum');
goog.require('monsoon.alpha.gli.DataModel');
goog.require('monsoon.alpha.gli.Mgmt');
goog.require('monsoon.alpha.gli.MgmtInputs');
goog.require('monsoon.alpha.gli.ModelControls');
goog.require('monsoon.alpha.gli.ModelState');
goog.require('monsoon.alpha.gli.ScenarioDatum');
goog.require('monsoon.alpha.gli.YieldModelResult');



/**
 * Models the impact of climate change and management changes on agricultural
 * production for a selected crop over a given area.
 * <p>
 * This is the only place where agriculture-related logic should live.
 * This class uses a {@link monsoon.alpha.gli.DataModel} instance to manage
 * the data that it needs to access to model these crop changes.
 * The {@code DataModel} knows how to load and store the data, but
 * does not interpret it in any way.
 * <p>
 * This class uses methodology from our partner GLI (the Global Landscapes
 * Initiative) from the University of Minnesota's Institute on the Environment.
 * More info at http://environment.umn.edu/gli/index.html
 * @param {monsoon.alpha.gli.DataModel} dataModel The data model to use.
 * @constructor
 */
monsoon.alpha.gli.CropModel = function(dataModel) {

  /**
   * The data model to use to access all crop-related data.
   * @type {monsoon.alpha.gli.DataModel}
   * @private
   */
  this.dataModel_ = dataModel;

  /**
   * The controls for the model, which determine its state.
   * @type {!monsoon.alpha.gli.ModelControls}
   * @private
   */
  this.modelControls_ = new monsoon.alpha.gli.ModelControls(
      monsoon.alpha.gli.CropModel.DEFAULT_CROP);

  /**
   * Some state of the crop model that needs to be made externally visible.
   * @type {!monsoon.alpha.gli.ModelState}
   * @private
   */
  this.modelState_ = monsoon.alpha.gli.ModelState.DEFAULT_STATE;

  /**
   * The management calculation functions to use.
   * @type {!monsoon.alpha.gli.Mgmt}
   * @private
   */
  this.mgmt_ = new monsoon.alpha.gli.Mgmt(dataModel);

  /**
   * An identifier for the world-model in use.
   * The world model is the model we apply for the WORLD granularity, and
   * it's currently super-simple, with all the state encoded in a single number.
   * @type number
   * @private
   */
  this.worldModelId_ = 0;
};


/**
 * Names for the layers of data that we load or compute, and store in
 * the data model.
 * <p>
 * The individual values are not significant, they just need to be unique.
 * @enum {string}
 * @const
 */
monsoon.alpha.gli.CropModel.LayerNames = {
  AREA: 'area',
  YIELD: 'yield',
  PRECIP: 'moisture',
  BASE_GDD: 'GDD',
  S_GDD: 's GDD',
  NITROGEN: 'applied nitrogen',
  PHOSPHORUS: 'applied phosphorus',
  POTASSIUM: 'applied potassium',
  IRRIGATION: 'applied irrigation',
  EXCESS_N: 'excess N',
  EXCESS_P: 'excess P',
  EXCESS_K: 'excess K',
  EXCESS_I: 'excess irr',
  S_YIELD: 's yield',
  S_PRECIP: 's moisture',
  S_NITROGEN: 's nitrogen',
  S_PHOSPHORUS: 's phosphorus',
  S_POTASSIUM: 's potassium',
  S_IRRIGATION: 's irrigation',
  S_X_NITROGEN: 's excess nitrogen',
  S_X_PHOSPHORUS: 's excess phosphorus',
  S_X_POTASSIUM: 's excess potassium',
  S_X_IRRIGATION: 's excess irrigation'
};


/**
 * Names of the layers that contain fertilizer data indicating what was
 * actually applied.
 * @type {Array.<string>}
 * @private
 * @const
 */
monsoon.alpha.gli.CropModel.FERTILIZER_LAYER_NAMES_ = [
  monsoon.alpha.gli.CropModel.LayerNames.NITROGEN,
  monsoon.alpha.gli.CropModel.LayerNames.PHOSPHORUS,
  monsoon.alpha.gli.CropModel.LayerNames.POTASSIUM];


/**
 * The default (initial) crop.
 * @type {string}
 * @const
 */
monsoon.alpha.gli.CropModel.DEFAULT_CROP = 'maize';


/**
 * Gets the most recent year that data is available for any crop that
 * can be modeled.
 * @param {string} cropName The name of the crop whose year is requested.
 * @return {number} The most recent year that crop data is available for
 *     the specified crop.
 */
monsoon.alpha.gli.CropModel.prototype.getYear = function(cropName) {
  var cropInfo = this.dataModel_.getCropInfo(cropName);
  var years = cropInfo.years;
  return years[years.length - 1];
};


/**
 * Checks if the model settings for the scenario seem reasonable or not.
 * @param {monsoon.alpha.gli.ModelControls} modelControls The controls to check.
 * @return {string} A descriptive message regarding the problem, or {@code null}
 *     if everything looks reasonable.
 */
monsoon.alpha.gli.CropModel.prototype.checkScenarioSanity = function(
    modelControls) {
  // our data model knows if settings are within the range we have data for.
  return this.dataModel_.checkScenarioSanity(modelControls);
};


/**
 * Gets the names of all the crops we can model.
 * @return {Array.<string>} The common names for the crops.
 */
monsoon.alpha.gli.CropModel.prototype.getCropNames = function() {
  // We can model whatever we have data for.
  return this.dataModel_.getCropNames();
};


/**
 * Gets the named layer.
 * @param {string} layerName The name of the layer to get.
 * @return {monsoon.maps.MapLayer} The layer, or {@code undefined} if not found.
 */
monsoon.alpha.gli.CropModel.prototype.getLayer = function(layerName) {
  return this.dataModel_.getLayer(layerName);
};


/**
 * Sets the model controls and updates the model.
 * The control values include which crop we're considering
 * and what the scenario is for that crop in terms of changes to climate
 * and management.
 * @param {!monsoon.alpha.gli.ModelControls} controlValues The specifics of
 *     what we want to model.
 */
monsoon.alpha.gli.CropModel.prototype.setModelControls = function(
    controlValues) {
  this.modelControls_ = controlValues;
  this.updateDataModel_();
  this.modelState_ = this.computeModelState_();
};


/**
 * Returns the current controls for the model.
 * @return {!monsoon.alpha.gli.ModelControls} The current state of the model.
 */
monsoon.alpha.gli.CropModel.prototype.getModelControls = function() {
  return this.modelControls_;
};


/**
 * Returns the current externally-accessible model state.
 * @return {!monsoon.alpha.gli.ModelState} The current state of the model.
 */
monsoon.alpha.gli.CropModel.prototype.getModelState = function() {
  return this.modelState_;
};


/**
 * Computes the current externally-visible model state.
 * @return {!monsoon.alpha.gli.ModelState} The current model state.
 * @private
 */
monsoon.alpha.gli.CropModel.prototype.computeModelState_ = function() {
  var doesHaveFertilizerData = true;
  var fertilizerNames = monsoon.alpha.gli.CropModel.FERTILIZER_LAYER_NAMES_;
  for (var i = 0, layerName; layerName = fertilizerNames[i]; i++) {
    if (!this.dataModel_.getLayer(layerName)) {
      doesHaveFertilizerData = false;
    }
  }

  var doesHaveIrrigationData = !!this.dataModel_.getLayer(
      monsoon.alpha.gli.CropModel.LayerNames.IRRIGATION);

  // TODO: check for dynamically loaded yield model.
  var doesHaveYieldModel =
      this.modelControls_.crop == monsoon.alpha.gli.CropModel.DEFAULT_CROP;

  return new monsoon.alpha.gli.ModelState(
      doesHaveFertilizerData, doesHaveIrrigationData, doesHaveYieldModel);
};


/**
 * Gets the {@link monsoon.alpha.gli.DataModel}.
 * @return {monsoon.alpha.gli.DataModel} The current data model.
 */
monsoon.alpha.gli.CropModel.prototype.getDataModel = function() {
  return this.dataModel_;
};


/**
 * Gets the model granularity.
 * @return {!monsoon.alpha.gli.ModelControls.granularity} The current
 *     model granularity.
 */
monsoon.alpha.gli.CropModel.prototype.getGranularity = function() {
  return this.modelControls_.granularity;
};


/**
 * Sets the model granularity.  Updates the data model to reflect the new
 * setting.
 * @param {!monsoon.alpha.gli.ModelControls.granularity} granularity The
 *     new model granularity.
 */
monsoon.alpha.gli.CropModel.prototype.setGranularity = function(granularity) {
  if (granularity != this.modelControls_.granularity) {
    this.modelControls_.granularity = granularity;
    this.updateDataModel_();
  }
};


/**
 * Gets the current world-granularity model id.
 * @return {number} The id number of the current world model.
 */
monsoon.alpha.gli.CropModel.prototype.getWorldModelId = function() {
  return this.worldModelId_;
};


/**
 * Updates our data model, letting it know all the data needed to compute the
 * current model.  When the data arrives a callback will trigger recalculation
 * of the model.
 * @private
 */
monsoon.alpha.gli.CropModel.prototype.updateDataModel_ = function() {
  var cropInfo = this.dataModel_.getCropInfo(this.modelControls_.crop);
  var layerNames = monsoon.alpha.gli.CropModel.LayerNames;
  if (this.modelControls_.granularity ==
      monsoon.alpha.gli.ModelControls.granularity.WORLD) {
    this.worldModelId_ = cropInfo.worldModelId;
  }

  this.dataModel_.replaceDbLayer(
      layerNames.YIELD,
      cropInfo.table,
      cropInfo.yieldField);
  this.dataModel_.replaceDbLayer(
      layerNames.AREA,
      cropInfo.table,
      cropInfo.areaField);
  this.dataModel_.replaceLayer(
      layerNames.PRECIP,
      this.dataModel_.makePrecipLayer());
  this.dataModel_.replaceLayer(
      layerNames.BASE_GDD,
      this.dataModel_.makeGddLayer(this.modelControls_.crop, 0));
  var tempChange = this.modelControls_.tempChange;
  this.dataModel_.replaceLayer(
      layerNames.S_GDD,
      this.dataModel_.makeGddLayer(this.modelControls_.crop, tempChange));
  var mgmtLayers = [layerNames.NITROGEN, layerNames.PHOSPHORUS,
      layerNames.POTASSIUM, layerNames.IRRIGATION];
  this.replaceNPKILayers_(mgmtLayers, cropInfo);

  // Set up the computed layers, so we can show them on the map.
  this.refreshComputedLayer_(layerNames.S_YIELD, layerNames.YIELD);
  this.refreshComputedLayer_(layerNames.S_PRECIP, layerNames.PRECIP);
  this.refreshComputedLayer_(layerNames.S_NITROGEN, layerNames.NITROGEN);
  this.refreshComputedLayer_(layerNames.S_PHOSPHORUS, layerNames.PHOSPHORUS);
  this.refreshComputedLayer_(layerNames.S_POTASSIUM, layerNames.POTASSIUM);
  this.refreshComputedLayer_(layerNames.S_IRRIGATION, layerNames.IRRIGATION);
  this.refreshComputedLayer_(layerNames.S_X_NITROGEN, layerNames.NITROGEN);
  this.refreshComputedLayer_(layerNames.S_X_PHOSPHORUS, layerNames.PHOSPHORUS);
  this.refreshComputedLayer_(layerNames.S_X_POTASSIUM, layerNames.POTASSIUM);
  this.refreshComputedLayer_(layerNames.S_X_IRRIGATION, layerNames.IRRIGATION);
};


/**
 * Refreshes the named computed layer.
 * <p>
 * If the named base layer exists, then any existing computed data in the named
 * layer will be discarded, allowing new data to be computed.  If the named
 * base layer does not exist then the named layer will be removed and there
 * will not be any computed layer associated with this layer name.
 * @param {string} layerName The name of the layer to refresh.
 * @param {string} baseLayerName The base layer this computed layer is based on.
 * @private
 */
monsoon.alpha.gli.CropModel.prototype.refreshComputedLayer_ = function(
    layerName, baseLayerName) {
  this.dataModel_.replaceComputedLayer(layerName, this.getLayer(baseLayerName));
};


/**
 * Replaces all management layers, using the layer names supplied.
 * @param {Array.<string>} mgmtLayers The names of the layers to replace.
 * @param {monsoon.alpha.gli.CropInfo} cropInfo The info for this crop
 *     that specifies where to get the data used for each replacement layer.
 * @private
 */
monsoon.alpha.gli.CropModel.prototype.replaceNPKILayers_ = function(
  mgmtLayers, cropInfo) {
  for (var compEnum in monsoon.alpha.gli.MgmtInputs.MgmtComponent) {
    var comp = monsoon.alpha.gli.MgmtInputs.MgmtComponent[compEnum];
    var layerName = mgmtLayers[comp];
    var tableName = cropInfo.getTableName(comp);
    var fieldName = cropInfo.getFieldName(comp);
    this.replaceNPKILayer_(layerName, tableName, fieldName);
  }
};


/**
 * Replaces a management data layer.  If we have both a table name and
 * a field name for that layer, then a new DB layer is used, otherwise
 * the layer is removed.
 * @param {string} layerName The name of the layer to replace.
 * @param {?string} tableName The name of the table.
 * @param {?string} fieldName The name of the field in the table.
 * @private
 */
monsoon.alpha.gli.CropModel.prototype.replaceNPKILayer_ = function(
    layerName, tableName, fieldName) {
  if (fieldName && tableName) {
    this.dataModel_.replaceDbLayer(layerName, tableName, fieldName);
  } else {
    this.dataModel_.replaceLayer(layerName, null);
  }
};


/**
 * Computes the current and new yields for the given location.
 * @param {!google.maps.LatLng} loc The location to do
 *     the yield calculation for.
 * @return {!monsoon.alpha.gli.ScenarioDatum} the computed yields.
 */
monsoon.alpha.gli.CropModel.prototype.computeScenarioDatum = function(
    loc) {
  // TODO: refactor this method to separate aspects of its
  // functionality (data access vs computation) and make it
  // more easily testable.
  var cropId = this.modelControls_.crop;
  var layerNames = monsoon.alpha.gli.CropModel.LayerNames;
  var curYield = this.dataModel_.getLayerValue(loc, layerNames.YIELD);
  var area = this.dataModel_.getLayerValue(loc, layerNames.AREA);
  var precip = this.dataModel_.getLayerValue(loc, layerNames.PRECIP);
  var gdd = this.dataModel_.getLayerValue(loc, layerNames.BASE_GDD);
  var nInput = this.dataModel_.getLayerValue(loc, layerNames.NITROGEN);
  var pInput = this.dataModel_.getLayerValue(loc, layerNames.PHOSPHORUS);
  var kInput = this.dataModel_.getLayerValue(loc, layerNames.POTASSIUM);
  var iInput = this.dataModel_.getLayerValue(loc, layerNames.IRRIGATION);
  var mgmtInputs = new monsoon.alpha.gli.MgmtInputs(
      [nInput, pInput, kInput, iInput]);
  var bin = null;
  if (precip && gdd) {
    bin = this.dataModel_.findClimateBin(cropId, precip, gdd);
  }
  var curPotYield = null;
  if (bin != null) {
    curPotYield = this.dataModel_.findPotentialYield(cropId, bin);
  }
  var yieldModelResult;
  if (this.modelState_.doesHaveYieldModel &&
      this.modelState_.doesHaveFertilizerData) {
    yieldModelResult = this.mgmt_.forwardYieldModel(cropId, bin, mgmtInputs);
  } else {
    yieldModelResult = new monsoon.alpha.gli.YieldModelResult(
        curYield, monsoon.alpha.gli.MgmtInputs.EMPTY_INPUTS);
  }
  var curCropDatum = new monsoon.alpha.gli.CropDatum(
      curYield, precip, gdd, bin, curPotYield, mgmtInputs, yieldModelResult);

  var newPrecip = null;
  if (precip && this.modelControls_.precipChange) {
    var factor = 100 + this.modelControls_.precipChange;
    newPrecip = precip * factor / 100;
  }
  var newGdd = this.dataModel_.getLayerValue(loc, layerNames.S_GDD);
  if (newGdd == gdd) {
    newGdd = null;
  }
  var newBin = null;
  var newData = newPrecip || newGdd;
  if (newData) {
    var aGdd = newGdd || gdd;
    var aPrecip = newPrecip || precip;
    newBin = this.dataModel_.findClimateBin(cropId, aPrecip, aGdd);
  }
  var newPotYield = curPotYield;
  if (newBin != null) {
    newPotYield = this.dataModel_.findPotentialYield(cropId, newBin);
  }
  var modelBias = curCropDatum.getModeledYield() / curCropDatum.getYield();
  // if we have management data and a yield model, compute a modeled yield,
  // otherwise just scale the empirical yield by the change in potential yield.
  var newYield;
  var newYieldModelResult;
  var newMgmtInputs = this.getScenarioMgmt_(mgmtInputs);
  if (this.modelState_.doesHaveYieldModel &&
      this.modelState_.doesHaveFertilizerData) {
    newYieldModelResult = this.mgmt_.forwardYieldModel(
        cropId, newBin || bin, newMgmtInputs);
    newYield = newYieldModelResult.getModeledYield();
    if (modelBias) {
      newYield = newYield / modelBias;
    }
  } else if (newPotYield != null && curPotYield) {
    newYield = curYield * newPotYield / curPotYield;
  } else {
    newYield = curYield;
  }
  if (!newYieldModelResult) {
    // TODO: Is there a way to compute excess without a yield model?
    newYieldModelResult = new monsoon.alpha.gli.YieldModelResult(
        newYield, yieldModelResult.getExcess());
  }
  newPrecip = newPrecip == null ? precip : newPrecip;
  var newCropDatum = new monsoon.alpha.gli.CropDatum(
      newYield,
      newPrecip,
      newGdd,
      newBin,
      newPotYield,
      newMgmtInputs,
      newYieldModelResult);

  // Update data in computed layers.
  this.dataModel_.setLayerValue(loc, layerNames.S_YIELD, newYield);
  this.dataModel_.setLayerValue(loc, layerNames.S_PRECIP, newPrecip);
  this.dataModel_.setLayerValue(
      loc, layerNames.S_NITROGEN, newMgmtInputs.getNitrogen());
  this.dataModel_.setLayerValue(
      loc, layerNames.S_PHOSPHORUS, newMgmtInputs.getPhosphorus());
  this.dataModel_.setLayerValue(
      loc, layerNames.S_POTASSIUM, newMgmtInputs.getPotassium());
  this.dataModel_.setLayerValue(
      loc, layerNames.S_IRRIGATION, newMgmtInputs.getIrrigation());
  var scenarioExcess = newYieldModelResult.getExcess();
  this.dataModel_.setLayerValue(
      loc, layerNames.S_X_NITROGEN, scenarioExcess.getNitrogen());
  this.dataModel_.setLayerValue(
      loc, layerNames.S_X_PHOSPHORUS, scenarioExcess.getPhosphorus());
  this.dataModel_.setLayerValue(
      loc, layerNames.S_X_POTASSIUM, scenarioExcess.getPotassium());
  this.dataModel_.setLayerValue(
      loc, layerNames.S_X_IRRIGATION, scenarioExcess.getIrrigation());

  return new monsoon.alpha.gli.ScenarioDatum(
      loc, area, curCropDatum, newCropDatum, modelBias, this.modelState_);
};



/**
 * Computes the current and new yields for the given location.
 * @param {!google.maps.LatLng} loc The location to do
 *     the yield calculation for.
 * @return {!monsoon.alpha.gli.ScenarioDatum} the computed yields.
 */
monsoon.alpha.gli.CropModel.prototype.computeScenarioDatum2 = function(
    loc, nPctg, pPctg, kPctg, iSwitch) {
  // TODO: refactor this method to separate aspects of its
  // functionality (data access vs computation) and make it
  // more easily testable.
  var cropId = this.modelControls_.crop;
  var layerNames = monsoon.alpha.gli.CropModel.LayerNames;
  var curYield = this.dataModel_.getLayerValue(loc, layerNames.YIELD);
  var area = this.dataModel_.getLayerValue(loc, layerNames.AREA);
  var precip = this.dataModel_.getLayerValue(loc, layerNames.PRECIP);
  var gdd = this.dataModel_.getLayerValue(loc, layerNames.BASE_GDD);
  var nInput = this.dataModel_.getLayerValue(loc, layerNames.NITROGEN);
  var pInput = this.dataModel_.getLayerValue(loc, layerNames.PHOSPHORUS);
  var kInput = this.dataModel_.getLayerValue(loc, layerNames.POTASSIUM);
  var iInput = this.dataModel_.getLayerValue(loc, layerNames.IRRIGATION);
  var mgmtInputs = new monsoon.alpha.gli.MgmtInputs(
      [nInput, pInput, kInput, iInput]);
  var bin = null;
  if (precip && gdd) {
    bin = this.dataModel_.findClimateBin(cropId, precip, gdd);
  }
  var curPotYield = null;
  if (bin != null) {
    curPotYield = this.dataModel_.findPotentialYield(cropId, bin);
  }
  var yieldModelResult;
  if (this.modelState_.doesHaveYieldModel &&
      this.modelState_.doesHaveFertilizerData) {
      yieldModelResult = this.mgmt_.forwardYieldModel(cropId, bin, mgmtInputs);
  } else {
    yieldModelResult = new monsoon.alpha.gli.YieldModelResult(
        curYield, monsoon.alpha.gli.MgmtInputs.EMPTY_INPUTS);
  }
  var curCropDatum = new monsoon.alpha.gli.CropDatum(
      curYield, precip, gdd, bin, curPotYield, mgmtInputs, yieldModelResult);

  var newPrecip = null;
  if (precip && this.modelControls_.precipChange) {
    var factor = 100 + this.modelControls_.precipChange;
    newPrecip = precip * factor / 100;
  }
  var newGdd = this.dataModel_.getLayerValue(loc, layerNames.S_GDD);
  if (newGdd == gdd) {
    newGdd = null;
  }
  var newBin = null;
  var newData = newPrecip || newGdd;
  if (newData) {
    var aGdd = newGdd || gdd;
    var aPrecip = newPrecip || precip;
    newBin = this.dataModel_.findClimateBin(cropId, aPrecip, aGdd);
  }
  var newPotYield = curPotYield;
  if (newBin != null) {
    newPotYield = this.dataModel_.findPotentialYield(cropId, newBin);
  }
  var modelBias = curCropDatum.getModeledYield() / curCropDatum.getYield();
  // if we have management data and a yield model, compute a modeled yield,
  // otherwise just scale the empirical yield by the change in potential yield.
  var newYield;
  var newYieldModelResult;
  //var newMgmtInputs = this.getScenarioMgmt_(mgmtInputs);
  var newMgmtInputs = new monsoon.alpha.gli.MgmtInputs(
      [nInput*(1+nPctg), pInput*(1+pPctg), kInput*(1+kPctg), iInput]);
      
  if (this.modelState_.doesHaveYieldModel &&
      this.modelState_.doesHaveFertilizerData) {
    newYieldModelResult = this.mgmt_.forwardYieldModel2(
        cropId, bin, mgmtInputs, newMgmtInputs, curYield);
    newYield = newYieldModelResult.getModeledYield();
    
    
    //if (modelBias) {
      //newYield = newYield / modelBias;
    //}
  } else if (newPotYield != null && curPotYield) {
    newYield = curYield * newPotYield / curPotYield;
  } else {
    newYield = curYield;
  }
  
  
  if (!newYieldModelResult) {
    // TODO: Is there a way to compute excess without a yield model?
    newYieldModelResult = new monsoon.alpha.gli.YieldModelResult(
        newYield, yieldModelResult.getExcess());
  }
  newPrecip = newPrecip == null ? precip : newPrecip;
  var newCropDatum = new monsoon.alpha.gli.CropDatum(
      newYield,
      newPrecip,
      newGdd,
      newBin,
      newPotYield,
      newMgmtInputs,
      newYieldModelResult);

  // Update data in computed layers.
  
  this.dataModel_.setLayerValue(loc, layerNames.S_YIELD, newYield);
  this.dataModel_.setLayerValue(loc, layerNames.YIELD, curYield);

/*  
  this.dataModel_.setLayerValue(loc, layerNames.S_PRECIP, newPrecip);
  this.dataModel_.setLayerValue(
      loc, layerNames.S_NITROGEN, newMgmtInputs.getNitrogen());
  this.dataModel_.setLayerValue(
      loc, layerNames.S_PHOSPHORUS, newMgmtInputs.getPhosphorus());
  this.dataModel_.setLayerValue(
      loc, layerNames.S_POTASSIUM, newMgmtInputs.getPotassium());
  this.dataModel_.setLayerValue(
      loc, layerNames.S_IRRIGATION, newMgmtInputs.getIrrigation());
  var scenarioExcess = newYieldModelResult.getExcess();
  this.dataModel_.setLayerValue(
      loc, layerNames.S_X_NITROGEN, scenarioExcess.getNitrogen());
  this.dataModel_.setLayerValue(
      loc, layerNames.S_X_PHOSPHORUS, scenarioExcess.getPhosphorus());
  this.dataModel_.setLayerValue(
      loc, layerNames.S_X_POTASSIUM, scenarioExcess.getPotassium());
  this.dataModel_.setLayerValue(
      loc, layerNames.S_X_IRRIGATION, scenarioExcess.getIrrigation());
  */
  return new monsoon.alpha.gli.ScenarioDatum(
      loc, area, curCropDatum, newCropDatum, modelBias, this.modelState_);
};

/**
 * Gets the scenario management inputs, which are based on the base management
 * inputs with the overrides defined in the current model state.
 * @param {!monsoon.alpha.gli.MgmtInputs} mgmtInputs The current management
 *     inputs from the model baseline.
 * @return {!monsoon.alpha.gli.MgmtInputs} The scenario inputs (baseline
 *     inputs with overrides applied).
 * @private
 */
monsoon.alpha.gli.CropModel.prototype.getScenarioMgmt_ = function(mgmtInputs) {
  var scenarioMgmt = new monsoon.alpha.gli.MgmtInputs(mgmtInputs);
  var overrides = this.modelControls_.mgmtOverrides;
  if (overrides) {
    for (var compEnum in monsoon.alpha.gli.MgmtInputs.MgmtComponent) {
      var component = monsoon.alpha.gli.MgmtInputs.MgmtComponent[compEnum];
      var override = overrides.getComponent(component);
      if (override != null) {
        scenarioMgmt.setComponent(component, override);
      }
    }
  }
  return scenarioMgmt;
};


/**
 * Gets the current state of this object in a form that can be persisted.
 * @return {!Object} A state that can be persisted, and restored
 *     with {@link #setCurrentState}.
 */
monsoon.alpha.gli.CropModel.prototype.getCurrentState = function() {
  return {'model_controls': this.modelControls_.getCurrentState()};
};


/**
 * Sets the current state of this object from the supplied persisted state.
 * @param {Object} state The persisted state to set in this object.
 */
monsoon.alpha.gli.CropModel.prototype.setCurrentState = function(state) {
  if (state && 'model_controls' in state) {
    this.modelControls_.setCurrentState(state['model_controls']);
  }
};


/**
 * Gets the model controls for this crop model.
 * @return {!monsoon.alpha.gli.ModelControls} The model controls.
 */
monsoon.alpha.gli.CropModel.prototype.getModelControls = function() {
  return this.modelControls_;
};

