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
 * @fileoverview Calculates crop yields based on management inputs,
 * for the GLI scenario planning component of the Monsoon project.
 * @author Donn Denman
 */

goog.provide('monsoon.alpha.gli.InverseYieldModelResult');
goog.provide('monsoon.alpha.gli.Mgmt');
goog.provide('monsoon.alpha.gli.MgmtInputs');
goog.provide('monsoon.alpha.gli.YieldModelResult');



/**
 * Constructs an object which reflects management inputs for
 * fertilizer and irrigation.
 * @param {monsoon.alpha.gli.MgmtInputs|Array.<number>=} opt_inputs Optional
 *     existing input, either a {@link monsoon.alpha.gli.MgmtInputs} object,
 *     or an array of inputs: n, p, k, and i. The first three are fertilizer
 *     (N, P, K) and I is for irrigation.
 * @constructor
 */
monsoon.alpha.gli.MgmtInputs = function(opt_inputs) {
  var vector = [0, 0, 0, 0];
  if (opt_inputs) {
    if (opt_inputs instanceof monsoon.alpha.gli.MgmtInputs) {
      vector = opt_inputs.inputsVector_.concat();
    } else {
      vector = opt_inputs.concat();
    }
  }

  /**
   * The vector of inputs: n, p, k, and i.
   * The first three are fertilizer (N, P, K) and I is for irrigation.
   * @type {Array.<?number>}
   * @private
   */
  this.inputsVector_ = vector;
};


/**
 * Management (N, P, K, I) component enumeration.  We always apply the
 * management inputs in this order.
 * @enum {number}
 */
monsoon.alpha.gli.MgmtInputs.MgmtComponent = {
  'N': 0,
  'P': 1,
  'K': 2,
  'I': 3
};


/**
 * A singleton with all inputs empty.
 * @type {monsoon.alpha.gli.MgmtInputs}
 * @const
 */
monsoon.alpha.gli.MgmtInputs.EMPTY_INPUTS =
    new monsoon.alpha.gli.MgmtInputs([null, null, null, null]);


/**
 * Converts a {@code monsoon.alpha.gli.MgmtInputs} to a {@code string}
 * description.
 * @return {string} Shows the values of n, p, k, and i.
 */
monsoon.alpha.gli.MgmtInputs.prototype.toString = function() {
  var data = this.inputsVector_ && this.inputsVector_.join(', ');
  return '[object MgmtInputs (' + data + ')]';
};


/**
 * Returns the vector of management inputs for this object (n, p, k, and i).
 * @return {Array.<number>} The management inputs array.
 */
monsoon.alpha.gli.MgmtInputs.prototype.getInputsVector = function() {
  return this.inputsVector_;
};


/**
 * Gets the specified management component's value.
 * @param {monsoon.alpha.gli.MgmtInputs.MgmtComponent} mgmtComponent The
 *     component to get.
 * @return {?number} The value of that management component, or {@code null}
 *     if that component is not available.
 */
monsoon.alpha.gli.MgmtInputs.prototype.getComponent = function(mgmtComponent) {
  return this.inputsVector_[mgmtComponent];
};


/**
 * Sets the specified management component's value.
 * @param {!monsoon.alpha.gli.MgmtInputs.MgmtComponent} mgmtComponent The
 *     component to set.
 * @param {?number} value The value to set for that management component.
 */
monsoon.alpha.gli.MgmtInputs.prototype.setComponent = function(
    mgmtComponent, value) {
  this.inputsVector_[mgmtComponent] = value;
};


/**
 * Gets N, the amount of Nitrogen applied.
 * @return {?number} The Nitrogen applied, in kg/ha, or {@code null}
 *     when not available.
 */
monsoon.alpha.gli.MgmtInputs.prototype.getNitrogen = function() {
  return this.getComponent(monsoon.alpha.gli.MgmtInputs.MgmtComponent.N);
};


/**
 * Returns P, the amount of Phosphorus applied.
 * @return {?number} The Phosphorus applied, in kg/ha, or {@code null}
 *     when not available.
 */
monsoon.alpha.gli.MgmtInputs.prototype.getPhosphorus = function() {
  return this.getComponent(monsoon.alpha.gli.MgmtInputs.MgmtComponent.P);
};


/**
 * Returns K, the amount of Potassium applied.
 * @return {?number} The Potassium (K) applied, in kg/ha, or {@code null}
 *     when not available.
 */
monsoon.alpha.gli.MgmtInputs.prototype.getPotassium = function() {
  return this.getComponent(monsoon.alpha.gli.MgmtInputs.MgmtComponent.K);
};


/**
 * Returns the irrigation amount, in fraction of area.
 * @return {?number} The fraction irrigated.
 */
monsoon.alpha.gli.MgmtInputs.prototype.getIrrigation = function() {
  return this.getComponent(monsoon.alpha.gli.MgmtInputs.MgmtComponent.I);
};


/**
 * Returns the total fertilizer component of the management, in kg/ha,
 * counting only N, P, and K.
 * @return {?number} The total amount, or {@code null} when some fertilizer
 *     component is not available.
 */
monsoon.alpha.gli.MgmtInputs.prototype.getFertilizerTotal = function() {
  if (this.getNitrogen() == null ||
      this.getPhosphorus() == null ||
      this.getPotassium() == null) {
    return null;
  }
  return this.getNitrogen() + this.getPhosphorus() + this.getPotassium();
};


/**
 * Adds the value specified to the management component specified.  If
 * the {@code valueToAdd} is {@code null} then nothing is done.
 * @param {monsoon.alpha.gli.MgmtInputs.MgmtComponent} mgmtComponent The
 *     management component to add to.
 * @param {?number} valueToAdd The value to add to the component, or
 *     {@code null} if no value should be added.
 */
monsoon.alpha.gli.MgmtInputs.prototype.addToComponent = function(
    mgmtComponent, valueToAdd) {
  if (valueToAdd != null) {
    this.inputsVector_[mgmtComponent] += valueToAdd;
  }
};


/**
 * Scales all the components by the given scale factor.
 * @param {number} scaleFactor The amount to multiply each component by.
 * @return {!monsoon.alpha.gli.MgmtInputs} Returns {@code this}, for chaining.
 */
monsoon.alpha.gli.MgmtInputs.prototype.scaleComponents = function(
    scaleFactor) {
  for (var compEnum in monsoon.alpha.gli.MgmtInputs.MgmtComponent) {
    var comp = monsoon.alpha.gli.MgmtInputs.MgmtComponent[compEnum];
    this.inputsVector_[comp] *= scaleFactor;
  }
  return this;
};


/**
 * Gets the current state of this object in a form that can be persisted.
 * @return {!Array.<number>} A state that can be persisted, and restored
 *     with {@link #setCurrentState}.
 */
monsoon.alpha.gli.MgmtInputs.prototype.getCurrentState = function() {
  return this.inputsVector_;
};


/**
 * Sets the current object from the supplied persisted state.
 * @param {Object} state The persisted state to set in this object.
 */
monsoon.alpha.gli.MgmtInputs.prototype.setCurrentState = function(state) {
  if (state) {
    this.inputsVector_ = state;
  }
};


/**
 * Constructs a result of a yield model calculation.
 * @param {number} modeledYield The yield predicted by the model.
 * @param {monsoon.alpha.gli.MgmtInputs} excess The excess inputs.
 * @constructor
 */
monsoon.alpha.gli.YieldModelResult = function(modeledYield, excess) {

  /**
   * The yield predicted by the model.
   * @type {number}
   * @private
   */
  this.modeledYield_ = modeledYield;

  /**
   * Excess inputs that will be wasted, based on the model.
   * @type {monsoon.alpha.gli.MgmtInputs}
   * @private
   */
  this.excess_ = excess;
};


/**
 * Gets the modeled yield (in tons/hectare) from the modeled yield result.
 * @return {number} The modeled yield.
 */
monsoon.alpha.gli.YieldModelResult.prototype.getModeledYield = function() {
  return this.modeledYield_;
};


/**
 * Gets the excess nutrients from the modeled yield result.
 * @return {monsoon.alpha.gli.MgmtInputs} The modeled excess nutrients.
 */
monsoon.alpha.gli.YieldModelResult.prototype.getExcess = function() {
  return this.excess_;
};


/**
 * Converts a {@code monsoon.alpha.gli.YieldModelResult} to a {@code string}
 * description.
 * @return {string} shows the modeled yield of the result, but not other
 *     properties of the {@code monsoon.alpha.gli.YieldModelResult}.
 */
monsoon.alpha.gli.YieldModelResult.prototype.toString = function() {
  return '[object YieldModelResult (' + this.modeledYield_ + ')]';
};



/**
 * Constructs a result of an inverse yield model calculation.
 * @param {number} achievedYield The yield actually achievable, according
 *     to the model.
 * @param {monsoon.alpha.gli.MgmtInputs} required The required inputs.
 * @param {monsoon.alpha.gli.MgmtInputs} excess The excess inputs.
 * @param {string} yieldLimitationFlags Flags indicating what's limiting
 *     the yield.
 * @constructor
 */
monsoon.alpha.gli.InverseYieldModelResult = function(
    achievedYield, required, excess, yieldLimitationFlags) {

  /**
   * The crop yield in tons/hectare that can be achieved.
   * @type {number}
   * @private
   */
  this.achievedYield_ = achievedYield;

  /**
   * The management inputs required for the yield to be achieved.
   * @type {monsoon.alpha.gli.MgmtInputs}
   * @private
   */
  this.required_ = required;

  /**
   * The excess inputs (waste and pollution) predicted by the model.
   * @type {monsoon.alpha.gli.MgmtInputs}
   * @private
   */
  this.excess_ = excess;

  /**
   * Flags indicating which inputs are limiting the crop yield.
   * @type {string}
   * @private
   */
  this.yieldLimitationFlags_ = yieldLimitationFlags;
};


/**
 * Gets the yield that can be achieved, according to the model.
 * @return {number} The achieved yield, in tons/ha.
 */
monsoon.alpha.gli.InverseYieldModelResult.prototype.getAchievedYield =
    function() {
  return this.achievedYield_;
};


/**
 * Gets the required inputs for the achieved yield.
 * @return {monsoon.alpha.gli.MgmtInputs} The management inputs required.
 */
monsoon.alpha.gli.InverseYieldModelResult.prototype.getRequired = function() {
  return this.required_;
};


/**
 * Gets the excess inputs (waste and pollution) predicted by the model.
 * @return {monsoon.alpha.gli.MgmtInputs} The modeled excess inputs.
 */
monsoon.alpha.gli.InverseYieldModelResult.prototype.getExcess =
    function() {
  return this.excess_;
};


/**
 * Gets a set of flags that indicate which inputs limit the yield.
 *
 * Note: the model currently does not produce anything meaningful
 * for this value.
 *
 * @return {string} A string of 0's and 1's indicating which input(s) limit
 *     the yield.
 */
monsoon.alpha.gli.InverseYieldModelResult.prototype.getYieldLimitationFlags =
    function() {
  return this.yieldLimitationFlags_;
};



/**
 * Constructs a container class for yield functions based on management inputs.
 * @param {!monsoon.alpha.gli.DataModel} dataModel The data model, which
 *     provides yield model data.
 * @constructor
 */
monsoon.alpha.gli.Mgmt = function(dataModel) {
  /**
   * The data model instance, used to get yield model data.
   * @type {!monsoon.alpha.gli.DataModel}
   * @private
   */
  this.dataModel_ = dataModel;
};


/**
 * Calculates the modeled yield based on crop management inputs.
 *
 * Note: this implementation is just a placeholder!
 * The yields computed are not at all valid - they are just wild guesses.
 * The {@code crop} and {@code soilType} parameters are currently ignored.
 * TODO: Update this code to do real yield calculations.
 *
 * @param {string} crop Name of the crop - currently unused.
 * @param {number} climateBin The climate bin index.
 * @param {Object} mgmtInputs The {@code monsoon.alpha.gli.MgmtInputs}
 *     reflecting current input levels.
 * @param {string=} opt_soilType Optional description of soil type - Currently
 *     ignored.
 * @return {monsoon.alpha.gli.YieldModelResult} The modeled yield and excess.
 */
monsoon.alpha.gli.Mgmt.prototype.forwardYieldModel = function(
    crop, climateBin, mgmtInputs, opt_soilType) {

  var scaledInput4PotYield = this.scaledInput4PotentialYield_(climateBin);

  // Determine which input limits the yield
  var fracOfPot = 1;
  var actualFrac = [];
  for (var i = 0; i < scaledInput4PotYield.getInputsVector().length; ++i) {
    var neededInput = scaledInput4PotYield.getInputsVector()[i];
    var actualInput = mgmtInputs.getInputsVector()[i];
    if (neededInput > 0) {
      actualFrac[i] = Math.min(1, actualInput / neededInput);
    } else {
      // avoid divide by zero!  we're good for this input when zero is needed.
      actualFrac[i] = 1;
    }
    fracOfPot = Math.min(actualFrac[i], fracOfPot);
  }

  // Now compute excess based on the min yield.
  var baseYield = this.modelCell_(climateBin, 'minimum_yield_tons_per_ha');
  var potYield = this.modelCell_(climateBin, 'potential_yield_tons_per_ha');
  var modeledYield = baseYield + (potYield - baseYield) * fracOfPot;
  var excess = this.excessInputs_(mgmtInputs, fracOfPot, scaledInput4PotYield);

  return new monsoon.alpha.gli.YieldModelResult(modeledYield, excess);
};

monsoon.alpha.gli.Mgmt.prototype.forwardYieldModel2 = function(
    crop, climateBin, mgmtInputs, newMgmtInputs, curYield) {

	// Now compute excess based on the min yield.
	var baseYield = this.modelCell_(climateBin, 'minimum_yield_tons_per_ha');
	var potYield = this.modelCell_(climateBin, 'potential_yield_tons_per_ha');
	var aY, bNP, bK, cN, cP, cK;
	var N = mgmtInputs.getNitrogen();  
	var P = mgmtInputs.getPhosphorus();
	var K = mgmtInputs.getPotassium();

	cN = this.modelCell_(climateBin, 'c_N');
   cP = this.modelCell_(climateBin, 'c_P2O5');// * scaleFactor[1],
   cK = this.modelCell_(climateBin, 'c_K2O');// * scaleFactor[2],
   bNP = this.modelCell_(climateBin, 'b_nut');// * scaleFactor[2],
	// Don't know the value of bK, remove it temporaly   
   //bK = 0.7;// * scaleFactor[2],

	if(cN == null || cN <= 0) {
		cN = 0.008321;
	}
	
	if(cP == null || cP <= 0) {
		cP = 0.02957;	
	}
	
	// min
	var minN = 1 - bNP*Math.exp(-cN*N);
	var minP = 1 - bNP*Math.exp(-cP*P);
	var minK = 50000;//1 - bK*Math.exp(-cK*K);
	var curModelY = Math.min(minK, Math.min(minN,minP));
	
	N = newMgmtInputs.getNitrogen();  
	P = newMgmtInputs.getPhosphorus();
	K = newMgmtInputs.getPotassium();	

	minN = 1 - bNP*Math.exp(-cN*N);
	minP = 1 - bNP*Math.exp(-cP*P);
	minK = 500000;//1 - bK*Math.exp(-cK*K);
	
	var newModelY = Math.min(minK, Math.min(minN,minP));
	var yieldChange = newModelY - curModelY;
	if(isNaN(yieldChange) || yieldChange == null) {
		yieldChange = 0;
	}
	return new monsoon.alpha.gli.YieldModelResult(curYield + potYield*yieldChange, monsoon.alpha.gli.MgmtInputs.EMPTY_INPUTS);
};

/**
 * Calculates the inputs needed to achieve a target yield.
 *
 * Note: this implementation is just a placeholder!
 * The {@code crop} and {@code soilType} parameters are currently ignored
 * and no {@code yieldLimitationFlags} are produced in the result.
 * TODO: Update this code to do real yield calculations.
 *
 * @param {string} crop Name of the crop - currently unused.
 * @param {number} climateBin The climate bin index.
 * @param {string} soilType The type of soil - currently unused.
 * @param {number} targetYield The yield desired.
 * @param {Object} mgmtInputs The {@code MgmtInputs} currently applied, for use
 *     in calculating excess.  These do not limit yield.
 * @return {monsoon.alpha.gli.InverseYieldModelResult} Predictions of
 *     crop yield attributes.
 */
monsoon.alpha.gli.Mgmt.prototype.inverseYieldModel = function(
    crop, climateBin, soilType, targetYield, mgmtInputs) {
  var potYield = this.modelCell_(climateBin, 'potential_yield_tons_per_ha');
  var fracOfPot = Math.min(1, targetYield / potYield);
  var achievedYield = potYield * fracOfPot;
  var scaledInput4PotYield = this.scaledInput4PotentialYield_(
      climateBin);
  var required = [];
  for (var i = 0; i < scaledInput4PotYield.getInputsVector().length; i++) {
    required.push(scaledInput4PotYield.getInputsVector()[i] * fracOfPot);
  }
  var excess = this.excessInputs_(mgmtInputs, fracOfPot, scaledInput4PotYield);
  var yieldLimitFlags = 'unused';

  return new monsoon.alpha.gli.InverseYieldModelResult(
      achievedYield, required, excess, yieldLimitFlags);
};


/**
 * Returns the excess inputs expected, given the management inputs and
 * a fraction of the potential yield.
 * @param {monsoon.alpha.gli.MgmtInputs} mgmtInputs The inputs applied.
 * @param {number} fracOfPot A number between 0..1 indicating the fraction
 *     of the potential yield that can be attained.
 * @param {monsoon.alpha.gli.MgmtInputs} scaledInput4PotYield The inputs needed
 *     to achieve the potential yield.
 * @return {monsoon.alpha.gli.MgmtInputs} The excess inputs expected.
 * @private
 */
monsoon.alpha.gli.Mgmt.prototype.excessInputs_ = function(
    mgmtInputs, fracOfPot, scaledInput4PotYield) {
  var appliedInputs = mgmtInputs.getInputsVector();
  var potentialInputs = scaledInput4PotYield.getInputsVector();
  var excess = [];
  for (var i = 0; i < potentialInputs.length; i++) {
    // base waste is amount applied beyond what's needed for potential
    var waste = Math.max(0, appliedInputs[i] - potentialInputs[i]);
    // additional waste is a small percent of input in high yield conditions
    waste += Math.max(0, fracOfPot - 0.7) * 0.2 * potentialInputs[i];
    excess.push(waste);
  }
  return new monsoon.alpha.gli.MgmtInputs(excess);
};


/**
 * Returns the scaled inputs needed to achieve the potential yield.
 * @param {number} climateBin The climate bin whose yield we want.
 * @return {monsoon.alpha.gli.MgmtInputs} The inputs needed in that climate bin.
 * @private
 */
monsoon.alpha.gli.Mgmt.prototype.scaledInput4PotentialYield_ = function(
    climateBin) {
  var scaleFactor = monsoon.alpha.gli.Mgmt.SCALE_FACTOR_.getInputsVector();
  return new monsoon.alpha.gli.MgmtInputs([
    this.modelCell_(climateBin, 'c_N') * scaleFactor[0],
    this.modelCell_(climateBin, 'c_P2O5') * scaleFactor[1],
    this.modelCell_(climateBin, 'c_K2O') * scaleFactor[2],
    this.modelCell_(climateBin, 'c_irr') * scaleFactor[3]
  ]);
};


/**
 * Gets the specified cell from the yield model table.
 * @param {number} climateBin The climate bin whose cell we want.
 * @param {string} columnName The name of the column whose cell we want.
 * @return {number} The value of the cell named by the {@code columnName} in
 *     the row for the {@code climateBin}.
 * @private
 */
monsoon.alpha.gli.Mgmt.prototype.modelCell_ = function(
    climateBin, columnName) {
  return this.getTableEntry_(
      this.dataModel_.getYieldModelMaize(), columnName, climateBin);
};


/**
 * Gets the specified table cell entry.
 * On older browsers this implementation is very inefficient because it looks up
 * the mapping from column name to index each time, without caching.
 * TODO: remove support for older browsers?
 * @param {string} table The table ID.
 * @param {string} columnName The name of the column whose entry we want.
 * @param {number} rowIndex The index of the row whose entry we want.
 * @return {?number} The table cell from the specified row and column.
 * @throws {Error} An error when the column name cannot be found.
 * @private
 */
monsoon.alpha.gli.Mgmt.prototype.getTableEntry_ = function(
    table, columnName, rowIndex) {
  if (!table || !table.length) {
    return null;
  }
  var columnIndex = -1;
  var namesRow = table[0];
  // Check if we have a browser new enough to support indexOf on arrays.
  if (namesRow.indexOf) {
    columnIndex = namesRow.indexOf(columnName);  // returns -1 on fail
  } else {
    // Support for older browsers
    for (var i = 0, name; name = namesRow[i]; ++i) {
      if (name == columnName) {
        columnIndex = i;
        break;
      }
    }
  }
  if (columnIndex === -1) {
    throw 'column not found: ' + columnName;
  }
  return table[rowIndex + 1][columnIndex];
};


/**
 * Scaling factors used to scale model constants
 * to real world application rates.
 * TODO: Remove this when a real yield model is implemented.
 * @type {monsoon.alpha.gli.MgmtInputs}
 * @const
 * @private
 */
monsoon.alpha.gli.Mgmt.SCALE_FACTOR_ =
    new monsoon.alpha.gli.MgmtInputs([10000, 5000, 3000, 10]);
