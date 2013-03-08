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
 * @fileoverview Utility classes used by the crop model, for GLI.
 * @author Donn Denman
 */

goog.provide('monsoon.alpha.gli.ModelControls');
goog.provide('monsoon.alpha.gli.ModelState');



/**
 * Encapsulates a set of controls for the crop model.
 * @param {string} crop Common name of the crop to model.
 * @param {number=} opt_precipChange Optional change in precipitation as a
 *     percentage.
 * @param {number=} opt_tempChange Optional change in temperature in degrees C.
 * @param {number=} opt_totalYield Optional total average yield target,
 *     in tons/ha.
 * @param {monsoon.alpha.gli.MgmtInputs=} opt_mgmt Optional management inputs
 *     which override the empirical fertilizer application amounts.
 * @param {monsoon.alpha.gli.ModelControls.granularity=} opt_granularity
 *     Optional granularity for the model.
 * @constructor
 */
monsoon.alpha.gli.ModelControls = function(
    crop, opt_precipChange, opt_tempChange, opt_totalYield, opt_mgmt,
    opt_granularity) {
  /**
   * The crop to model.
   * @type {string}
   */
  this.crop = crop;

  /**
   * The change in precipitation as a percentage to be modeled.
   * @type {number}
   */
  this.precipChange = opt_precipChange || 0;

  /**
   * The change in temperature in degrees C to model.
   * @type {number}
   */
  this.tempChange = opt_tempChange || 0;

  /**
   * The total average yield target.
   * @type {number}
   */
  this.totalYield = opt_totalYield || 0;

  /**
   * The management input overrides.  These values override a mangement
   * input to the specified value.  Values of {@code null} indicate
   * no override, allowing the value to float.
   * @type {!monsoon.alpha.gli.MgmtInputs}
   */
  this.mgmtOverrides = opt_mgmt || new monsoon.alpha.gli.MgmtInputs(
      monsoon.alpha.gli.ModelControls.NO_OVERRIDES);

  /**
   * The granularity level at which we are modeling data.
   * @type {!monsoon.alpha.gli.ModelControls.granularity}
   */
  this.granularity = opt_granularity ||
      monsoon.alpha.gli.ModelControls.granularity.WORLD;
};


/**
 * A set of management input overrides in which nothing is overriden.
 * @type {!monsoon.alpha.gli.MgmtInputs}
 * @const
 */
monsoon.alpha.gli.ModelControls.NO_OVERRIDES =
    monsoon.alpha.gli.MgmtInputs.EMPTY_INPUTS;


/**
 * Members of this object, which allow abstract access to member values.
 * @enum {string}
 * @see #getNamedState
 */
monsoon.alpha.gli.ModelControls.members = {
  CROP: 'crop',
  PRECIP: 'precip',
  TEMP: 'temp',
  TOTAL_YIELD: 'totalYield',
  N_OVR: 'N_Ovr',
  P_OVR: 'P_Ovr',
  K_OVR: 'K_Ovr',
  I_OVR: 'I_Ovr'
};


/**
 * Granularity of our model, indicating at what level we are modeling crops.
 * @enum {string}
 */
monsoon.alpha.gli.ModelControls.granularity = {
  WORLD: 'world',
  LOCAL: 'local'
};

/**
 * Clears the overrides for the model controls.
 */
monsoon.alpha.gli.ModelControls.prototype.clearOverrides = function() {
  this.mgmtOverrides = new monsoon.alpha.gli.MgmtInputs(
      monsoon.alpha.gli.ModelControls.NO_OVERRIDES);
};


/**
 * Gets the current state of this object in a form that can be persisted.
 * @return {!Object} A state that can be persisted, and restored
 *     with {@link #setCurrentState}.
 */
monsoon.alpha.gli.ModelControls.prototype.getCurrentState = function() {
  return {
    'active_crop': this.crop,
    'precip_change': this.precipChange,
    'temp_change': this.tempChange,
    'mgmt_overrides': this.mgmtOverrides.getCurrentState(),
    'granularity': this.granularity
  };
};


/**
 * Sets the current state from the supplied persisted state.
 * @param {Object} state The persisted state to use to set this object's values.
 */
monsoon.alpha.gli.ModelControls.prototype.setCurrentState = function(state) {
  if (state) {
    this.crop = state['active_crop'] || this.crop;
    this.precipChange = state['precip_change'] || this.precipChange;
    this.tempChange = state['temp_change'] || this.tempChange;
    this.mgmtOverrides.setCurrentState(state['mgmt_overrides']);
    this.granularity = state['granularity'] || this.granularity;
  }
};


/**
 * Gets the state of a member of this object specified by the
 * supplied logical name.
 * @param {monsoon.alpha.gli.ModelControls.members} name The name of the
 *     part of the model control to get.
 * @return {number} The value of that named control.
 * @see monsoon.alpha.gli.ModelControls.members
 */
monsoon.alpha.gli.ModelControls.prototype.getMemberState = function(name) {
  switch (name) {
    case monsoon.alpha.gli.ModelControls.members.CROP:
      return this.crop;
    case monsoon.alpha.gli.ModelControls.members.PRECIP:
      return this.precipChange;
    case monsoon.alpha.gli.ModelControls.members.TEMP:
      return this.tempChange;
    case monsoon.alpha.gli.ModelControls.members.TOTAL_YIELD:
      return this.totalYield;
    case monsoon.alpha.gli.ModelControls.members.N_OVR:
      return this.mgmtOverrides.getNitrogen();
    case monsoon.alpha.gli.ModelControls.members.P_OVR:
      return this.mgmtOverrides.getPhosphorus();
    case monsoon.alpha.gli.ModelControls.members.K_OVR:
      return this.mgmtOverrides.getPotassium();
    case monsoon.alpha.gli.ModelControls.members.I_OVR:
      return this.mgmtOverrides.getIrrigation();
    default:
      throw Error('Unknown named state ' + name);
  }
};


/**
 * Encapsulates some state for the crop model that can be externally visible.
 * @param {boolean} doesHaveFertilizerData Whether the current model
 *     includes fertilizer data.
 * @param {boolean} doesHaveIrrigationData Whether the current model
 *     includes irrigation data.
 * @param {boolean} doesHaveYieldModel Whether the current model
 *     includes a crop yield model or not.
 * @constructor
 */
monsoon.alpha.gli.ModelState = function(
    doesHaveFertilizerData, doesHaveIrrigationData, doesHaveYieldModel) {
  /**
   * Tracks whether the current model includes fertilizer data.
   * @type {boolean}
   */
  this.doesHaveFertilizerData = doesHaveFertilizerData;

  /**
   * Tracks whether the current model includes irrigation data.
   * @type {boolean}
   */
  this.doesHaveIrrigationData = doesHaveIrrigationData;

  /**
   * Inidicates whether the current crop model includes a crop yield model
   * or not.
   * @type {boolean}
   */
  this.doesHaveYieldModel = doesHaveYieldModel;
};


/**
 * Default state, all capabilities {@code false}.
 * @const
 */
monsoon.alpha.gli.ModelState.DEFAULT_STATE =
    new monsoon.alpha.gli.ModelState(false, false, false);
