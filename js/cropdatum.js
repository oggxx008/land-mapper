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
 * @fileoverview Crop data support classes for Monsoon.
 * Encapsulates all crop-related data and how it may change in a scenario under
 * consideration in the GLI scenario planner.
 * @author Donn Denman
 */

goog.provide('monsoon.alpha.gli.CropDatum');
goog.provide('monsoon.alpha.gli.ScenarioAggregate');
goog.provide('monsoon.alpha.gli.ScenarioDatum');

goog.require('monsoon.alpha.gli.MgmtInputs');
goog.require('monsoon.alpha.gli.ModelState');
goog.require('monsoon.alpha.gli.YieldModelResult');


/**
 * A single datapoint describing crop cultivation at some location for a single
 * crop.
 * <p>
 * This captures all pertinent growing conditions, including climate,
 * management inputs such as fertilizer, and by-products such as excess
 * nutrients.
 * <p>
 * This datum may reflect either empirical crop production, or hypothetical
 * crop production based on model output for some scenario.
 * @param {?number} cropYield The yield for this crop in tons/ha,
 *     or {@code null} if this datum is not available.
 * @param {?number} precip The precipitation in mm/year for this location,
 *     or {@code null} if this datum is not available.
 * @param {?number} gdd The Growing Degree Days in C/year for this location,
 *     or {@code null} if this datum is not available.
 * @param {?number} climateBin The climate bin for this location,
 *     or {@code null} if this datum is not available.
 * @param {?number} potentialYield The potential yield for this location,
 *     or {@code null} if this datum is not available.
 * @param {!monsoon.alpha.gli.MgmtInputs} mgmtInputs The fertilizer and
 *     irrigation inputs.
 * @param {!monsoon.alpha.gli.YieldModelResult} yieldModelResult The modeled
 *     yield and excess nutrients.
 * @constructor
 */
monsoon.alpha.gli.CropDatum = function(
    cropYield,
    precip,
    gdd,
    climateBin,
    potentialYield,
    mgmtInputs,
    yieldModelResult) {

  /**
   * The crop yield in tons/hectare for this location, or {@code null}.
   * @type {?number}
   * @private
   */
  this.cropYield_ = cropYield;

  /**
   * The precipitation in mm/year for this location, or {@code null}.
   * @type {?number}
   * @private
   */
  this.precip_ = precip;

  /**
   * The Growing Degree Days in C/year for this location, or {@code null}.
   * @type {?number}
   * @private
   */
  this.gdd_ = gdd;

  /**
   * The climate bin for this location.  Range: 1-100, or {@code null}.
   * @type {?number}
   * @private
   */
  this.climateBin_ = climateBin;

  /**
   * The potential yield for this location in tons/ha, or {@code null}.
   * @type {?number}
   * @private
   */
  this.potentialYield_ = potentialYield;

  /**
   * The management inputs (fertilizer and irrigation).
   * @type {!monsoon.alpha.gli.MgmtInputs}
   * @private
   */
  this.mgmtInputs_ = mgmtInputs;

  /**
   * The modeled yield and excess nutrients.
   * @type {!monsoon.alpha.gli.YieldModelResult}
   * @private
   */
  this.yieldModelResult_ = yieldModelResult;
};


/**
 * Gets the yield for this location in tons/ha.
 * @return {?number} The current yield,
 *     or {@code null} if this datum is not available.
 */
monsoon.alpha.gli.CropDatum.prototype.getYield = function() {
  return this.cropYield_;
};


/**
 * Gets the precipitation for this location in mm/year.
 * @return {?number} The precipitation,
 *     or {@code null} if this datum is not available.
 */
monsoon.alpha.gli.CropDatum.prototype.getPrecip = function() {
  return this.precip_;
};


/**
 * Gets the GDD - Growing Degree Days for this location.
 * @return {?number} Growing degree days in degrees C per year,
 *     or {@code null} if this datum is not available.
 */
monsoon.alpha.gli.CropDatum.prototype.getGdd = function() {
  return this.gdd_;
};


/**
 * Gets the climate for this location.
 * @return {?number} A bin number in the range from 1-100 inclusive,
 *     or {@code null} if this datum is not available.
 */
monsoon.alpha.gli.CropDatum.prototype.getClimateBin = function() {
  return this.climateBin_;
};


/**
 * Gets the potential yield in this location in tons/ha,
 *     or {@code null} if this datum is not available.
 * @return {?number} The potential yield.
 */
monsoon.alpha.gli.CropDatum.prototype.getPotentialYield = function() {
  return this.potentialYield_;
};


/**
 * Gets the management inputs (fertilizer and irrigation}.
 * Fertilizer is in kg/ha, irrigation is a fraction of the total area
 * that is irrigated.
 * @return {!monsoon.alpha.gli.MgmtInputs} The management inputs.
 */
monsoon.alpha.gli.CropDatum.prototype.getMgmtInputs = function() {
  return this.mgmtInputs_;
};


/**
 * Gets the forward yield model result, which includes projected yield and
 * excess nutrients.
 * @return {!monsoon.alpha.gli.YieldModelResult} The modeled yield in tons/ha
 *     and excess nutrients expressed as management inputs.
 */
monsoon.alpha.gli.CropDatum.prototype.getYieldModelResult = function() {
  return this.yieldModelResult_;
};


/**
 * Gets the modeled yield for this datum.
 * @return {?number} The modeled yield, or {@code null} when there is no
 *     modeled yield available.
 */
monsoon.alpha.gli.CropDatum.prototype.getModeledYield = function() {
  return this.yieldModelResult_.getModeledYield();
};


/**
 * Gets the excess management inputs.
 * @return {!monsoon.alpha.gli.MgmtInputs} The modeled excess nutrients.
 */
monsoon.alpha.gli.CropDatum.prototype.getMgmtExcess = function() {
  return this.yieldModelResult_.getExcess();
};


/**
 * Gets the total fertilizer.
 * @return {?number} The fertilizer total in kg/ha,
 *     or {@code null} when fertilizer data is not available.
 */
monsoon.alpha.gli.CropDatum.prototype.getFertilizerTotal = function() {
  return this.getMgmtInputs().getFertilizerTotal();
};


/**
 * Returns the irrigation amount, in fraction of area.
 * @return {?number} The amount of irrigation actually applied, or that
 *     would actually be applied in the scenario under consideration,
 *     or {@code null} if this data is not available.
 */
monsoon.alpha.gli.CropDatum.prototype.getIrrigation = function() {
  return this.getMgmtInputs().getIrrigation();
};


/**
 * Gets the modeled excess fertilizer.
 * @return {?number} The modeled excess fertilizer total in kg/ha,
 *     or {@code null} when fertilizer data is not available.
 */
monsoon.alpha.gli.CropDatum.prototype.getExcessFertilizer = function() {
  return this.getMgmtExcess().getFertilizerTotal();
};



/**
 * Computes changes associated with crop production at a given location
 * due to changes in the scenario being explored.
 * Baseline and scenario crop information must be supplied along
 * with the location and area under cultivation.
 * @param {google.maps.LatLng} location The location of the cell
 *     being evaluated in the scenario.
 * @param {?number} area The fraction of the cell cultivated, or {@code null}
 *     if no area information is available for this cell.
 * @param {!monsoon.alpha.gli.CropDatum} baseCropDatum The base datum before
 *     any scenario change.
 * @param {!monsoon.alpha.gli.CropDatum} scenarioCropDatum The changed datum,
 *     reflecting the scenario under consideration.
 * @param {?number} modelBias The bias between the modeled yield and the
 *     observed (or projected) empirical yield, computed as
 *     a ratio: modeledYield / empiricalYield.
 * @constructor
 */
monsoon.alpha.gli.ScenarioDatum = function(
    location, area, baseCropDatum, scenarioCropDatum, modelBias) {

  /**
   * The location this crop information applies to.
   * @type {google.maps.LatLng}
   * @private
   */
  this.location_ = location;

  /**
   * The fraction of the cell area under cultivation by some crop,
   *   or {@code null} if this datum is not available.
   * @type {?number}
   * @private
   */
  this.area_ = area;

  /**
   * The current crop information (before a scenario change).
   * @type {!monsoon.alpha.gli.CropDatum}
   * @private
   */
  this.baseCropDatum_ = baseCropDatum;

  /**
   * The scenario crop information, reflecting some change(s).
   * @type {!monsoon.alpha.gli.CropDatum}
   * @private
   */
  this.scenarioCropDatum_ = scenarioCropDatum;

  /**
   * The bias between the modeled yield and the observed (or projected)
   * empirical yield, computed as a ratio: modeledYield / empiricalYield.
   * @type {?number}
   * @private
   */
  this.modelBias_ = modelBias;
};


/**
 * Gets the location this crop information applies to.
 * @return {google.maps.LatLng} The location.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getLocation = function() {
  return this.location_;
};


/**
 * Gets the base crop information (before a scenario change).
 * @return {monsoon.alpha.gli.CropDatum} The base crop information.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getBaseCropDatum = function() {
  return this.baseCropDatum_;
};


/**
 * Gets the updated crop information (after some scenario change).
 * @return {monsoon.alpha.gli.CropDatum} The scenario crop infromation.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getScenarioCropDatum = function() {
  return this.scenarioCropDatum_;
};


/**
 * Gets the change in yield due to the change in scenario.
 * @return {?number} The change in yield, in tons/ha, or {@code null}
 *     when there is missing yield information.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getYieldDelta = function() {
  if (this.getScenarioCropDatum().getYield() == null ||
      this.getBaseCropDatum().getYield() == null) {
    return null;
  }
  return this.getScenarioCropDatum().getYield() -
      this.getBaseCropDatum().getYield();
};


/**
 * Gets the fraction of the cell area under cultivation by some crop.
 * @return {?number} The fraction under cultivation, ranging from 0 to 1,
 *     or {@code null} if area information is missing for this cell.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getArea = function() {
  return this.area_;
};


/**
 * Gets the amount of crop production in a cell.
 * @return {?number} The production in tons/ha,
 *     or {@code null} if this information is missing for this cell.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getProduction = function() {
  if (this.getScenarioCropDatum().getYield() == null ||
      this.getArea() == null) {
    return null;
  }
  return this.getScenarioCropDatum().getYield() * this.getArea();
};


/**
 * Gets the change in production due to the change in scenario.
 * @return {?number} The change in total production, in tons, or {@code null}
 *     when there is no new yield information.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getProductionDelta = function() {
  if (this.getYieldDelta() == null || this.getArea() == null) {
    return null;
  }
  return this.getYieldDelta() * this.getArea();
};


/**
 * Gets the change in total fertilizer inputs.
 * @return {?number} The change in total fertilizer inputs, or {@code null} if
 *     not known.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getFertilizerDelta = function() {
  var baseFertilizer = this.getBaseCropDatum().getFertilizerTotal();
  var scenarioFertilizer = this.getScenarioCropDatum().getFertilizerTotal();
  if (baseFertilizer == null || scenarioFertilizer == null) {
    return null;
  }
  return scenarioFertilizer - baseFertilizer;
};


/**
 * Gets the change in total excess fertilizer inputs.
 * @return {?number} The change in total excess fertilizer inputs,
 *     or {@code null} if not known.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getExcessFertilizerDelta =
    function() {
  var baseExcess = this.getBaseCropDatum().getExcessFertilizer();
  var scenarioExcess = this.getScenarioCropDatum().getExcessFertilizer();
  if (baseExcess == null || scenarioExcess == null) {
    return null;
  }
  return scenarioExcess - scenarioExcess;
};


/**
 * Gets the named management component from the given input vector.
 * @param {!monsoon.alpha.gli.MgmtInputs.MgmtComponent} mgmtComponent The
 *     management component to get.
 * @param {!monsoon.alpha.gli.MgmtInputs} mgmtInputs The management inputs whose
 *     component we want to get.
 * @return {?number} The management component (N, P, K or I).  Fertilizer
 *     values are in kg/ha, irrigation is in fraction of area irrigated.
 *     Returns {@code null} when this management component is not available.
 * @private
 */
monsoon.alpha.gli.ScenarioDatum.prototype.mgmtComponentLookup_ = function(
    mgmtComponent, mgmtInputs) {
  var inputVector = mgmtInputs.getInputsVector();
  var result = inputVector[mgmtComponent];
  if (result === undefined) {
    return null;
  }
  return result;
};


/**
 * Gets the base value of the given management application, e.g. fertilizer
 * actually applied.
 * @param {!monsoon.alpha.gli.MgmtInputs.MgmtComponent} mgmtComponent The
 *     management component whose base applied value we want to get.
 * @return {?number} The amount of that component applied, or {@code null} if
 *     this data is not available.  The number returned is computed
 *     in kg/ha for fertilizer or a fraction for irrigation.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getBaseApplied = function(
    mgmtComponent) {
  return this.mgmtComponentLookup_(
      mgmtComponent, this.getBaseCropDatum().getMgmtInputs());
};


/**
 * Gets the scenario value of the given management application, e.g. fertilizer
 * applied under the scenario being considered.
 * @param {!monsoon.alpha.gli.MgmtInputs.MgmtComponent} mgmtComponent The
 *     management component whose scenario applied value we want to get.
 * @return {?number} The amount of that component applied in the scenario
 *     under consideration, or {@code null} if this data is not available.
 *     The number returned is computed in kg/ha for fertilizer or
 *     a fraction for irrigation.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getScenarioApplied = function(
    mgmtComponent) {
  return this.mgmtComponentLookup_(
      mgmtComponent, this.getScenarioCropDatum().getMgmtInputs());
};


/**
 * Gets the base value of the excess for the given management application,
 * e.g. excess Nitrogen fertilizer actually applied
 * (as calculated by the model).
 * @param {!monsoon.alpha.gli.MgmtInputs.MgmtComponent} mgmtComponent The
 *     management component whose base excess value we want to get.
 * @return {?number} The excess amount of that component applied,
 *     or {@code null} if this data is not available.
 *     The number returned is computed in kg/ha for fertilizer
 *     or a fraction for irrigation.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getBaseExcess = function(
    mgmtComponent) {
  return this.mgmtComponentLookup_(
      mgmtComponent, this.getBaseCropDatum().getMgmtExcess());
};


/**
 * Gets the scenario value of the excess of the given management application,
 * e.g. excess fertilizer applied, as calculated by the model,
 * under the scenario being considered.
 * @param {!monsoon.alpha.gli.MgmtInputs.MgmtComponent} mgmtComponent The
 *     management component whose scenario excess value we want to get.
 * @return {?number} The excess amount of that component applied in the scenario
 *     under consideration, or {@code null} if this data is not available.
 *     The number returned is computed in kg/ha for fertilizer or
 *     a fraction for irrigation.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getScenarioExcess = function(
    mgmtComponent) {
  return this.mgmtComponentLookup_(
      mgmtComponent, this.getScenarioCropDatum().getMgmtExcess());
};


/**
 * Gets the model bias for this datum.
 * <p>
 * This value captures differences between the real-world yield and the
 * modeled yield.  If the model is good, then this number should be near 1,
 * but there are several reasons why it might not be:
 * <ul>
 * <li>
 *   Growing conditions are more or less advantagous than expected in a way that
 *   is not captured by the model (e.g. seed quality issues).
 * <li>
 *   Management data could be more coarse than yield data due to poor tracking
 *   of fertilizer application versus crop production.
 * </ul>
 * <p>
 * This value expresses the ratio between the modeled yield and
 * the empirical yield.  Although this value can be {@code null} or
 * {@code undefined}, it should never be in practice, though it can be
 * {@code NaN} or {@code Infinity}.
 * <p>
 * A value greater than 1 means the model predicts a higher yield than is
 * actually observed.  A value less than 1 means the model predicts a lower
 * yield than the observed empirical yield (or projected empirical yield
 * in a scenario being explored).  A value of {@code Infinity} means the
 * empirical (or projected empirical) yield is 0.  A value of {@code NaN}
 * is likely due to a bug.
 * @return {?number} The model bias, or {@code Infinity} or {@code NaN}
 *     when a bias cannot be calculated.
 */
monsoon.alpha.gli.ScenarioDatum.prototype.getModelBias = function() {
  return this.modelBias_;
};


/**
 * Aggregates the changes in crop production due to
 * a change in scenario, over an entire area for some crop.
 * Calculates simple statistics about increasing and decreasing
 * crop production, crop yield, and related agricultural metrics.
 * @param {Array.<monsoon.alpha.gli.ScenarioDatum>} scenarioData
 *     An array of locations with crop scenario changes.
 * @param {!monsoon.alpha.gli.ModelState} modelState The state of the model,
 *     which tells us which data layers exist.
 * @constructor
 */
monsoon.alpha.gli.ScenarioAggregate = function(scenarioData, modelState) {
  /**
   * The state of the model, including what management data is available.
   * @type {monsoon.alpha.gli.ModelState}
   * @private
   */
  this.modelState_ = modelState;

  var baseYieldCount = 0;
  var baseYieldTotal = 0;
  var baseProductionTotal = 0;
  var incompleteDataCount = 0;
  var areaTotal = 0;
  var scenarioYieldCount = 0;
  var scenarioYieldTotal = 0;
  var scenarioProductionTotal = 0;
  var unchangedCount = 0;
  var increasingCount = 0;
  var decreasingCount = 0;
  var increasingTotal = 0;
  var decreasingTotal = 0;
  var fertilizerTotal = 0;
  var excessFertilizerTotal = 0;
  var scenarioFertilizerTotal = 0;
  var scenarioExcessFertilizer = 0;

  var baseMgmtApplied = new monsoon.alpha.gli.MgmtInputs();
  var baseMgmtExcess = new monsoon.alpha.gli.MgmtInputs();
  var scenarioMgmtApplied = new monsoon.alpha.gli.MgmtInputs();
  var scenarioMgmtExcess = new monsoon.alpha.gli.MgmtInputs();

  for (var i = 0, cell; cell = scenarioData[i]; i++) {
    var isIncomplete = false;
    // Area and current yield should either both be null or both non-null.
    if ((cell.getArea() == null ||
        cell.getBaseCropDatum().getYield() == null) &&
        cell.getArea() != cell.getBaseCropDatum().getYield()) {
      isIncomplete = true;
    }
    // This cell is also considered incomplete if there exists data for
    // fertilizer or irrigation, but we have none for this cell.
    if (this.modelState_.doesHaveFertilizerData &&
        cell.getBaseCropDatum().getFertilizerTotal() == null) {
      isIncomplete = true;
    }
    if (this.modelState_.doesHaveIrrigationData &&
        cell.getBaseCropDatum().getIrrigation() == null) {
      isIncomplete = true;
    }
    if (isIncomplete) {
      incompleteDataCount += 1;
    }
    var area = cell.getArea() || 0;
    if (cell.getBaseCropDatum().getYield() != null) {
      baseYieldCount += 1;
      baseYieldTotal += cell.getBaseCropDatum().getYield();
      areaTotal += area;
      baseProductionTotal += cell.getBaseCropDatum().getYield() * area;
    }
    if (cell.getScenarioCropDatum().getYield() != null) {
      scenarioYieldCount += 1;
      scenarioYieldTotal += cell.getScenarioCropDatum().getYield();
      scenarioProductionTotal += cell.getScenarioCropDatum().getYield() * area;
    }
    if (cell.getBaseCropDatum().getFertilizerTotal() != null) {
      fertilizerTotal += cell.getBaseCropDatum().getFertilizerTotal();
    }
    if (cell.getBaseCropDatum().getExcessFertilizer() != null) {
      excessFertilizerTotal += cell.getBaseCropDatum().getExcessFertilizer();
    }
    if (cell.getScenarioCropDatum().getFertilizerTotal() != null) {
      scenarioFertilizerTotal +=
          cell.getScenarioCropDatum().getFertilizerTotal();
    }
    if (cell.getScenarioCropDatum().getExcessFertilizer() != null) {
      scenarioExcessFertilizer +=
          cell.getScenarioCropDatum().getExcessFertilizer();
    }
    for (var compEnum in monsoon.alpha.gli.MgmtInputs.MgmtComponent) {
      var mgmtComp = monsoon.alpha.gli.MgmtInputs.MgmtComponent[compEnum];
      baseMgmtApplied.addToComponent(
          mgmtComp, cell.getBaseApplied(mgmtComp));
      scenarioMgmtApplied.addToComponent(
          mgmtComp, cell.getScenarioApplied(mgmtComp));
      baseMgmtExcess.addToComponent(
          mgmtComp, cell.getBaseExcess(mgmtComp));
      scenarioMgmtExcess.addToComponent(
          mgmtComp, cell.getScenarioExcess(mgmtComp));
    }
    var delta = cell.getYieldDelta();
    if (delta != null) {
      if (delta === 0) {
        unchangedCount += 1;
      } else if (delta > 0) {
        increasingCount += 1;
        increasingTotal += delta;
      } else if (delta < 0) {
        decreasingCount += 1;
        decreasingTotal += delta;
      } else {
        throw Error('delta yield is not a number');
      }
    }
  }

  /**
   * All of these members are numbers.
   * @type {number}
   * @private
   */
  this.baseYieldCount_ = baseYieldCount;
  this.baseYieldTotal_ = baseYieldTotal;
  this.baseProductionTotal_ = baseProductionTotal;
  this.incompleteDataCount_ = incompleteDataCount;
  this.areaTotal_ = areaTotal;
  this.scenarioYieldCount_ = scenarioYieldCount;
  this.scenarioYieldTotal_ = scenarioYieldTotal;
  this.scenarioProductionTotal_ = scenarioProductionTotal;
  this.unchangedCount_ = unchangedCount;
  this.increasingCount_ = increasingCount;
  this.decreasingCount_ = decreasingCount;
  this.increasingTotal_ = increasingTotal;
  this.decreasingTotal_ = decreasingTotal;
  this.fertilizerTotal_ = fertilizerTotal;
  this.excessFertilizerTotal_ = excessFertilizerTotal;
  this.scenarioFertilizerTotal_ = scenarioFertilizerTotal;
  this.scenarioExcessFertilizer_ = scenarioExcessFertilizer;

  var byCellCount = 1 / scenarioData.length;

  /**
   * All of these members are management inputs.
   * @type {!monsoon.alpha.gli.MgmtInputs}
   * @private
   */
  this.baseMgmtApplied_ = baseMgmtApplied.scaleComponents(byCellCount);
  this.baseMgmtExcess_ = baseMgmtExcess.scaleComponents(byCellCount);
  this.scenarioMgmtApplied_ = scenarioMgmtApplied.scaleComponents(byCellCount);
  this.scenarioMgmtExcess_ = scenarioMgmtExcess.scaleComponents(byCellCount);
};


/**
 * The default precision to use when displaying information.
 * @type {number}
 * @const
 * @private
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.PRECISION_ = 5;


/**
 * Gets the yield count from the baseline.
 * @return {number} The count of yield values known.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getBaseYieldCount =
    function() {
  return this.baseYieldCount_;
};


/**
 * Gets the production total from the baseline.
 * @return {number} The baseline production total.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getBaseProductionTotal =
    function() {
  return this.baseProductionTotal_;
};


/**
 * Gets the average yield of the scenario baseline.
 * @return {?number} The average yield over all locations, not weighted by area,
 *     or {@code null} if this calculation cannot be made.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getBaseYieldAverage =
    function() {
  // TODO: change the contract of these methods to make the
  // calculations weighted by area!
  if (!this.baseYieldCount_) {
    return null;
  }
  return this.baseYieldTotal_ / this.baseYieldCount_;
};


/**
 * Gets the average yield after the scenario change.
 * @return {?number} The average yield over all locations, not weighted by area,
 *     or {@code null} if this calculation cannot be made.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getScenarioYieldAverage =
    function() {
  if (!this.scenarioYieldCount_) {
    return null;
  }
  return this.scenarioYieldTotal_ / this.scenarioYieldCount_;
};


/**
 * Gets the change in average yield.
 * @return {?number} The change in the average yield over all locations, not
 *     weighted by area, or {@code null} if this calculation can't be made.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getAverageYieldChange =
    function() {
  if (this.getScenarioYieldAverage() == null ||
      this.getBaseYieldAverage() == null) {
    return null;
  }
  return this.getScenarioYieldAverage() - this.getBaseYieldAverage();
};


/**
 * Gets the average area fraction.
 * @return {?number} The average fraction of area under cultivation,
 *     or {@code null} if this calculation cannot be made.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getAreaAverage =
    function() {
  if (!this.baseYieldCount_) {
    return null;
  }
  return this.areaTotal_ / this.baseYieldCount_;
};


/**
 * Gets the total production under the scenario for all cells.
 * @return {?number} The total production (in tons) under the scenario,
 *     or {@code null} if there are no scenario-changed cells.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getScenarioProductionTotal =
    function() {
  if (!this.scenarioYieldCount_) {
    return null;
  }
  return this.scenarioProductionTotal_;
};


/**
 * Gets the change in production for the entire area.
 * @return {?number} The production in tons for area under cultivation,
 *     or {@code null} if there are no scenario-changed cells.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getProductionChange =
    function() {
  if (!this.scenarioYieldCount_) {
    return null;
  }
  return this.scenarioProductionTotal_ - this.baseProductionTotal_;
};


/**
 * Gets the count of cells whose yields are increasing under the scenario.
 * @return {?number} The count of cells with increasing yields in the scenario,
 *     or {@code null} if there are no scenario-changed cells.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getIncreasingCount =
    function() {
  if (!this.scenarioYieldCount_) {
    return null;
  }
  return this.increasingCount_;
};


/**
 * Gets the count of cells whose yields are decreasing under the scenario.
 * @return {?number} The count of cells with decreasing yields in the scenario,
 *     or {@code null} if there are no scenario-changed cells.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getDecreasingCount =
    function() {
  if (!this.scenarioYieldCount_) {
    return null;
  }
  return this.decreasingCount_;
};


/**
 * Gets the average increase in yield not weighted by area.
 * @return {number} The average increase in yield, or {@code null}
 *     if this calculation cannot be made.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getAverageIncrease =
    function() {
  if (!this.increasingCount_) {
    return null;
  }
  return this.increasingTotal_ / this.increasingCount_;
};


/**
 * Gets the average decrease in yield not weighted by area.
 * @return {number} The average decrease in yield, or {@code null}
 *     if this calculation cannot be made.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getAverageDecrease =
    function() {
  if (!this.decreasingCount_) {
    return null;
  }
  return this.decreasingTotal_ / this.decreasingCount_;
};


/**
 * Gets the number of cells that have incomplete data values.  Whenever
 * we have area data we should also have current yield data.  Incomplete
 * data could reflect holes in the underlying data, or problems accessing
 * the data.
 * @return {number} The number of cells that have incomplete data.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getIncompleteDataCount =
    function() {
  return this.incompleteDataCount_;
};


/**
 * Gets the base amount of fertilizer applied.
 * @return {number} The total applied in kg/ha.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getBaseFertilizer = function() {
  return this.fertilizerTotal_;
};


/**
 * Gets the base amount of excess fertilizer applied (wasted).
 * @return {number} The total excess applied in kg/ha.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getBaseExcess = function() {
  return this.excessFertilizerTotal_;
};


/**
 * Gets the amount of fertilizer applied in the scenario under consideration.
 * @return {number} The total applied in kg/ha.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getScenarioFertilizer =
    function() {
  return this.scenarioFertilizerTotal_;
};


/**
 * Gets the amount of excess fertilizer applied (wasted) in the scenario
 * under consideration.
 * @return {number} The total excess applied in kg/ha.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getScenarioExcess = function() {
  return this.scenarioExcessFertilizer_;
};


/**
 * Gets the base management inputs applied.
 * @return {!monsoon.alpha.gli.MgmtInputs} The average NPKI applied in
 *     the model base.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getBaseMgmtApplied = function() {
  return this.baseMgmtApplied_;
};


/**
 * Gets the excess management inputs applied.
 * @return {!monsoon.alpha.gli.MgmtInputs} The average excess NPKI applied in
 *     the model base.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getBaseMgmtExcess = function() {
  return this.baseMgmtExcess_;
};


/**
 * Gets the management inputs applied in the scenario under consideration.
 * @return {!monsoon.alpha.gli.MgmtInputs} The average NPKI applied in the
 *     model scenario.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getScenarioMgmtApplied =
    function() {
  return this.scenarioMgmtApplied_;
};


/**
 * Gets the excess management inputs applied in the scenario under
 * consideration.
 * @return {!monsoon.alpha.gli.MgmtInputs} The average excess NPKI applied in
 *     the model scenario.
 */
monsoon.alpha.gli.ScenarioAggregate.prototype.getScenarioMgmtExcess =
    function() {
  return this.scenarioMgmtExcess_;
};

