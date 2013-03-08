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
 * @fileoverview Code to render the GLI crop scenario web page.
 * @author Michal Cierniak
 * @author Donn Denman
 */

goog.provide('monsoon.alpha.Gli');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.json');
goog.require('goog.structs');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Select');
goog.require('monsoon.alpha.gli.CropModel');
goog.require('monsoon.alpha.gli.DataModel');
goog.require('monsoon.alpha.gli.ModelControls');
goog.require('monsoon.maps.CellInfo');
goog.require('monsoon.maps.DbBridge');
goog.require('monsoon.maps.Map');
goog.require('monsoon.maps.MapLayer');
goog.require("monsoon.maps.GHeatmapLayer");
goog.require('monsoon.maps.PointInfo');
goog.require('monsoon.maps.Util');


/**
 * Provides an interactive scenario exploration tool for examining the impact
 * of climate change and management changes on agriculture.
 * <p>
 * This class provides the user experience for the application, but uses
 * a separate {@link monsoon.alpha.gli.CropModel} class to do all the
 * crop modeling and associated data retrieval.
 * <p>
 * This class uses methodology from our partner: GLI (the Global Landscapes
 * Initiative) from the University of Minnesota's Institute on the Environment.
 * More info at http://environment.umn.edu/gli/index.html
 * @param {monsoon.maps.DbBridge=} opt_dbBridge Optional object to use for
 *     database requests.
 * @param {monsoon.alpha.gli.CropModel=} opt_cropModel Optional crop model
 *     to use for testing, default is to create a new instance.
 * @constructor
 * @extends {monsoon.maps.Map}
 */
monsoon.alpha.Gli = function(opt_dbBridge, opt_cropModel) {
  goog.base(this, monsoon.alpha.Gli.IMPL_ID_, opt_dbBridge);

	// TODO: Work to simplify this initialization?
	var replaceMapLayerCallback = goog.bind(this.replaceMapLayer, this);
	//var dataModel = new monsoon.alpha.gli.DataModel(replaceMapLayerCallback, this.getDbBridge());
  	var dataModel = null;
	
  /**
   * The crop model to use. This determines policy for applying
   * changes in climate and management to the scenario, and models the changes.
   * @type {!monsoon.alpha.gli.CropModel}
   * @private
   */
  this.cropModel_ = opt_cropModel || new monsoon.alpha.gli.CropModel(dataModel);

  /**
   * The view controls for the model, which determine how we will view it.
   * @type {!monsoon.alpha.gli.GliView}
   * @private
   */
  this.view_ = new monsoon.alpha.gli.GliView();

  /**
   * Tracks wheather we're showing the map yet or not.
   * @type {boolean}
   * @private
   */
  this.showingMap_ = false;

  /**
   * Map for dynamically-built controls by their host element id.
   * @type {!Object}
   * @private
   */
  this.dynamicControlsMap_ = {};

  /**
   * The last world-model applied.
   * @type number
   * @private
   */
  this.lastWorldModelId_ = 0;

  /**
   * The last world-model overlay layer applied.
   * @type google.maps.FusionTablesLayer
   * @private
   */
  this.lastWorldModelLayer_ = null;
};

goog.inherits(monsoon.alpha.Gli, monsoon.maps.Map);
goog.addSingletonGetter(monsoon.alpha.Gli);
goog.exportSymbol("monsoon.alpha.Gli.initialize",monsoon.alpha.Gli);

/**
 * Initializes the GLI web page.
 */
monsoon.alpha.Gli.initialize = function() {
  var gli = monsoon.alpha.Gli.getInstance();
  var queryParams = gli.getQueryParams();
  var scenarioId = queryParams.scenario_id;
  if (scenarioId) {
    // Retrieve the scenario first and set up the page later.
    gli.loadScenario_(scenarioId);
  } else {
    // Set up the page right away.
    gli.setUpMonsoonMapPage();
  }
};

/**
 * Gets the dbbridge.
 * @return {!monsoon.maps.DbBridge} The current DB bridge in use.
 */
monsoon.alpha.Gli.prototype.getDbBridge = function() {
  return this.dbBridge;  // protected member from our super class
};


/**
 * Id of this implementation of the monsoon.maps.Map subclass.
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.Gli.IMPL_ID_ = 'GLI';


/**
 * Message telling the user that the saved state could not be loaded.
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.Gli.CANT_LOAD_MESSAGE_ = 'Sorry, the saved scenario was not found.';


/**
 * Threshold beyond which we shift into showing more detailed data.
 * Zoomed in to this threshold or less and we simply show a world view.
 * @type number
 * @private
 * @const
 */
monsoon.alpha.Gli.GRANULARITY_THRESHOLD_ = 6;


/**
 * Initial zoom level for the map.
 * @type number
 * @private
 * @const
 */
monsoon.alpha.Gli.INITIAL_ZOOM_ = 3;


/**
 * Minimum zoom level for the map.
 * @type number
 * @private
 * @const
 */
monsoon.alpha.Gli.MIN_ZOOM_ = 2;


/**
 * The default center of the map, latitude.
 * @type {number}
 * @private
 * @const
 */
monsoon.alpha.Gli.DEFAULT_CENTER_LAT_ = 40;


/**
 * The default center of the map, longitude.
 * @type {number}
 * @private
 * @const
 */
monsoon.alpha.Gli.DEFAULT_CENTER_LNG_ = -97;


/**
 * Flag to just skip cell creation altogether, as an experiment.
 * @type boolean
 * @private
 * @const
 */
monsoon.alpha.Gli.SKIP_CELL_CREATION_ = false;

/**
 * The default view to display using the bubble color.
 * This must be one of the VIEW_NAMES_ listed below.
 * @see monsoon.alpha.Gli.VIEW_NAMES_
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.Gli.DEFAULT_BUBBLE_COLOR_VIEW_ = 'Yield';


/**
 * The default view to display using the bubble size.
 * This must be one of the VIEW_NAMES_ listed below.
 * @see monsoon.alpha.Gli.VIEW_NAMES_
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.Gli.DEFAULT_BUBBLE_SIZE_VIEW_ = 'Area';


/**
 * The user-visible view names, and the order in which they are shown.
 * <p>
 * Views are mapped onto scenario layers of the crop model through this table.
 * In general, we don't view the baseline layers, because the
 * user is typically interested in the scenario's data.  Also, when there is
 * no scenario under exploration, the baseline data is reflected in the
 * scenario data, so resetting the scenario allows the baseline data to be
 * viewed.
 * @type {goog.structs.Map.<string,string>}
 * @private
 * @const
 */
monsoon.alpha.Gli.VIEW_NAMES_ = new goog.structs.Map({
  'Yield': monsoon.alpha.gli.CropModel.LayerNames.S_YIELD,
  'Area': monsoon.alpha.gli.CropModel.LayerNames.AREA,
  'Moisture': monsoon.alpha.gli.CropModel.LayerNames.S_PRECIP,
  'GDD': monsoon.alpha.gli.CropModel.LayerNames.S_GDD,
  'Nitrogen': monsoon.alpha.gli.CropModel.LayerNames.S_NITROGEN,
  'Phosphorus': monsoon.alpha.gli.CropModel.LayerNames.S_PHOSPHORUS,
  'Potassium': monsoon.alpha.gli.CropModel.LayerNames.S_POTASSIUM,
  'Irrigation': monsoon.alpha.gli.CropModel.LayerNames.S_IRRIGATION,
  'Excess nitrogen': monsoon.alpha.gli.CropModel.LayerNames.S_X_NITROGEN,
  'Excess phosphorus': monsoon.alpha.gli.CropModel.LayerNames.S_X_PHOSPHORUS,
  'Excess potassium': monsoon.alpha.gli.CropModel.LayerNames.S_X_POTASSIUM,
  'Excess irrigation': monsoon.alpha.gli.CropModel.LayerNames.S_X_IRRIGATION
});


/**
 * Dom IDs used by this code.  (Order is alphabetical).
 * @enum {string}
 * @private
 */
monsoon.alpha.Gli.DomIds_ = {
  APP_MENU_SAVE: 'app_menu_save',
  APP_MENU_SAVED_LINK_AREA: 'app_menu_saved_link_area',
  CLEAR_BUTTON: 'clear_button',
  COLOR_LAYERS: 'color_layers',
  DISPLAY_BAR_CONTENT: 'display_bar_content',
  IRRIGATION: 'irrigation',
  MESSAGE: 'message',
  NITROGEN: 'nitrogen',
  PHOSPHORUS: 'phosphorus',
  POTASSIUM: 'potassium',
  PRECIP_CHANGE: 'precip_change',
  SIZE_LAYERS: 'size_layers',
  SOURCES: 'sources',
  TEMP_CHANGE: 'temp_change',
  TOTAL_YIELD: 'total_yield',
  YEAR_CONTROL: 'year_control',
  ZOOM_NOTE: 'zoom_note'
};


/**
 * Dom Classes used by this code.  (Order is alphabetical).
 * @enum {string}
 * @private
 */
monsoon.alpha.Gli.DomClasses_ = {
  HIDE: 'hide',
  SHOW: 'show'
};


/**
 * The set of input control IDs that can trigger recalculation.
 * (Order is alphabetical).
 * @type {Array.<string>}
 * @private
 * @const
 */
monsoon.alpha.Gli.RECALC_INPUT_CONTROLS_ = [
  monsoon.alpha.Gli.DomIds_.IRRIGATION,
  monsoon.alpha.Gli.DomIds_.NITROGEN,
  monsoon.alpha.Gli.DomIds_.PHOSPHORUS,
  monsoon.alpha.Gli.DomIds_.POTASSIUM,
  monsoon.alpha.Gli.DomIds_.PRECIP_CHANGE,
  monsoon.alpha.Gli.DomIds_.TEMP_CHANGE,
  monsoon.alpha.Gli.DomIds_.TOTAL_YIELD
];


/**
 * List of control IDs for Management Override inputs, to disable when overrides
 * are not possible.
 * (Order is alphabetical).
 * @type {Array.<string>}
 * @private
 * @const
 */
monsoon.alpha.Gli.MGMT_OVERRIDES_ = [
  monsoon.alpha.Gli.DomIds_.IRRIGATION,
  monsoon.alpha.Gli.DomIds_.NITROGEN,
  monsoon.alpha.Gli.DomIds_.PHOSPHORUS,
  monsoon.alpha.Gli.DomIds_.POTASSIUM
];


/**
 * List of control IDs that should be disabled when using the world view.
 * (Order is alphabetical).
 * @type {Array.<string>}
 * @private
 * @const
 */
monsoon.alpha.Gli.DISABLED_IN_WORLD_VIEW_CONTROLS_ = [
  monsoon.alpha.Gli.DomIds_.COLOR_LAYERS,
  monsoon.alpha.Gli.DomIds_.IRRIGATION,
  monsoon.alpha.Gli.DomIds_.NITROGEN,
  monsoon.alpha.Gli.DomIds_.PHOSPHORUS,
  monsoon.alpha.Gli.DomIds_.POTASSIUM,
  monsoon.alpha.Gli.DomIds_.PRECIP_CHANGE,
  monsoon.alpha.Gli.DomIds_.SIZE_LAYERS,
  monsoon.alpha.Gli.DomIds_.TEMP_CHANGE
];


/**
 * Associates input control IDs with model control members.
 * @type {!Object}
 * @private
 * @const
 * @see monsoon.alpha.Gli.prototype.getModelControlValue_
 */
monsoon.alpha.Gli.INPUTS_TO_MODEL_ = {};
monsoon.alpha.Gli.INPUTS_TO_MODEL_[monsoon.alpha.Gli.DomIds_.IRRIGATION] =
    monsoon.alpha.gli.ModelControls.members.I_OVR;
monsoon.alpha.Gli.INPUTS_TO_MODEL_[monsoon.alpha.Gli.DomIds_.NITROGEN] =
    monsoon.alpha.gli.ModelControls.members.N_OVR;
monsoon.alpha.Gli.INPUTS_TO_MODEL_[monsoon.alpha.Gli.DomIds_.PHOSPHORUS] =
    monsoon.alpha.gli.ModelControls.members.P_OVR;
monsoon.alpha.Gli.INPUTS_TO_MODEL_[monsoon.alpha.Gli.DomIds_.POTASSIUM] =
    monsoon.alpha.gli.ModelControls.members.K_OVR;
monsoon.alpha.Gli.INPUTS_TO_MODEL_[monsoon.alpha.Gli.DomIds_.PRECIP_CHANGE] =
    monsoon.alpha.gli.ModelControls.members.PRECIP;
monsoon.alpha.Gli.INPUTS_TO_MODEL_[monsoon.alpha.Gli.DomIds_.TEMP_CHANGE] =
    monsoon.alpha.gli.ModelControls.members.TEMP;
monsoon.alpha.Gli.INPUTS_TO_MODEL_[monsoon.alpha.Gli.DomIds_.TOTAL_YIELD] =
    monsoon.alpha.gli.ModelControls.members.TOTAL_YIELD;


/**
 * Events that indicate loss of focus.
 * @type {Array.<goog.events.EventType>}
 * @private
 * @const
 */
monsoon.alpha.Gli.LOSE_FOCUS_EVENTS_ =
    [goog.events.EventType.FOCUSOUT, goog.events.EventType.BLUR];


/**
 * A message to tell the user data is being loaded and not yet available.
 * @private
 * @const
 */
monsoon.alpha.Gli.LOADING_MESSAGE_ = 'Loading data...';


/**
 * Anchor text for the link to the last saved scenario.
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.Gli.SAVED_SCENARIO_TEXT_ = 'Saved scenario';


/**
 * Prefix of the URL that points to the saved scenario.
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.Gli.SAVED_SCENARIO_URL_PREFIX_ = '/gli?scenario_id=';


/**
 * Cell stroke weight (outline thickness).
 * @type {number}
 * @private
 * @const
 */
monsoon.alpha.Gli.CELL_STROKE_WEIGHT_ = 0.5;


/**
 * Cell stroke weight (outline thickness) for a selected cell.
 * @type {number}
 * @private
 * @const
 */
monsoon.alpha.Gli.CELL_STROKE_WEIGHT_SELECTED_ = 1;


/** @inheritDoc */
monsoon.alpha.Gli.prototype.setActiveLayers = function() {
  this.updateCropModelForCrop_();
  this.refreshView_();
};

monsoon.alpha.Gli.prototype.applyManagement = function(nPctg, pPctg, kPctg, iSwitch) {
	var self = this;
	var layerObj = this.getBubbleColorLayer_(); //this.cropModel_.getLayer('s yield');
	var tilesInView = self.getTilesInBounds(layerObj);
	
	var cellIDs = [];
	var lat, lng;
	var latlng;
	var origVal;

	// Get the list of IDs
	for(var i = 0; i < tilesInView.length; i++) 
	{
		lat = tilesInView[i].lat;
		lng = tilesInView[i].lng;
		latlng = new google.maps.LatLng(lat, lng);
		
		origVal = tilesInView[i].value;
		
		var scenarioDatum = this.cropModel_.computeScenarioDatum2(latlng, nPctg, pPctg, kPctg, iSwitch);
		var scenarioCrop = scenarioDatum.getScenarioCropDatum();

		var newYield = scenarioCrop.getYield();
		
		if(newYield == origVal) {
			continue;		
		} else {	
			tilesInView[i].value = newYield;
			// Update the view of the cell
		}
	}
	this.notifyMapChanged();
};

/**
 * @inheritDoc
 * @override
 */
monsoon.alpha.Gli.prototype.defaultMapOptions = function() {
  var center = new google.maps.LatLng(monsoon.alpha.Gli.DEFAULT_CENTER_LAT_, monsoon.alpha.Gli.DEFAULT_CENTER_LNG_);
  
  return {
    zoom: monsoon.alpha.Gli.INITIAL_ZOOM_,
    minZoom: monsoon.alpha.Gli.MIN_ZOOM_,
    center: center,
	 mapTypeControl:true,
	 mapTypeControlOptions: {
      mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.TERRAIN, google.maps.MapTypeId.HYBRID],//, google.maps.MapTypeId.SATELLITE],
      style: google.maps.MapTypeControlStyle.DEFAULT,
      position: google.maps.ControlPosition.TOP_RIGHT
    }, 
 
    streetViewControl: false,
    overviewMapControl: true,
 
    overviewMapControlOptions: {
				opened: true,
				position: google.maps.ControlPosition.LEFT_BOTTOM    
    },
	 zoomControl: true,		
	 zoomControlOptions: {
    	style: google.maps.ZoomControlStyle.SMALL
  	},

    mapTypeId: google.maps.MapTypeId.TERRAIN
 };

};


/**
 * @inheritDoc
 * @override
 */
monsoon.alpha.Gli.prototype.mapChanged = function() {
	this.mapSnapshotList_.setMapPos(this.map_.getCenter(), Math.max(0, this.map_.getZoom()-2));
	
	this.updateWorldGranularityView_();
	var granularity = this.getGranularity_(this.getMap().getZoom());
	if (granularity == monsoon.alpha.gli.ModelControls.granularity.LOCAL) {
	// TODO: is there a better way of making sure the map is really set up?
	if (this.getMap().getBounds()) {
		goog.base(this, 'mapChanged');
	}
	} else if (granularity == monsoon.alpha.gli.ModelControls.granularity.WORLD) {
	this.gcAllTiles();
	} else {
	throw Error('Unknown granularity!');
	}
	
  	if(this.cropModel_ != null) {
		this.cropModel_.setGranularity(granularity);
		this.updateControlsEnabledState_();
	}	
};


/**
 * Gets the appropriate view granularity for a given zoom level.
 * @param {number} zoomLevel The given zoom level to consider.
 * @return {monsoon.alpha.gli.ModelControls.granularity} The granularity
 *     associated with that zoom level.
 * @private
 */
monsoon.alpha.Gli.prototype.getGranularity_ = function(zoomLevel) {
  if (zoomLevel >= monsoon.alpha.Gli.GRANULARITY_THRESHOLD_) {
    return monsoon.alpha.gli.ModelControls.granularity.LOCAL;
  } else {
    return monsoon.alpha.gli.ModelControls.granularity.WORLD;
  }
};


/**
 * Updates the zoom overlay notification based on the current zoom level.
 * @private
 */
monsoon.alpha.Gli.prototype.updateWorldGranularityView_ = function() {
  var hideWorldView = true;
  var overlay = goog.dom.getElement(monsoon.alpha.Gli.DomIds_.ZOOM_NOTE);
  if (overlay && this.getMap()) {
    var fromClassName, toClassName;
    if (this.getGranularity_(this.getMap().getZoom()) ==
        monsoon.alpha.gli.ModelControls.granularity.LOCAL) {
      fromClassName = monsoon.alpha.Gli.DomClasses_.SHOW;
      toClassName = monsoon.alpha.Gli.DomClasses_.HIDE;
    } else {
      hideWorldView = false;
      fromClassName = monsoon.alpha.Gli.DomClasses_.HIDE;
      toClassName = monsoon.alpha.Gli.DomClasses_.SHOW;
    }
    goog.dom.classes.swap(overlay, fromClassName, toClassName);
  }

  // Update the world-view layer.
  if(this.cropModel_ != null) {
  		var worldModelId = hideWorldView ? 0 : this.cropModel_.getWorldModelId();
  		this.updateWorldViewLayer_(worldModelId);
  }
};


/**
 * Updates the world view layer, which presents a simple world view
 * using fusion tables.
 * @param {number} worldModelId The world model ID to use (which is a
 *     Fusion Tables table ID), or 0 to remove the world view.
 * @private
 */
monsoon.alpha.Gli.prototype.updateWorldViewLayer_ = function(worldModelId) {
    
  if (this.lastWorldModelId_ != worldModelId && this.getMap()) {
    this.lastWorldModelId_ = worldModelId;
    
    if (this.lastWorldModelLayer_) {
      this.lastWorldModelLayer_.setMap(null);
    }
      
  
    if (worldModelId == monsoon.alpha.gli.DataModel.CEREALS_WORLD_MODEL_ID_) {
        console.log("***** fusion table layer");
      this.lastWorldModelLayer_ = new google.maps.FusionTablesLayer({
        query: {select: 'geometry',from: worldModelId},heatmap: {enabled: false}
        });
        
        this.lastWorldModelLayer_.setMap(this.getMap());
    }
        
  }
    
};


/**
 * Notify the user with a warning message.  The message shown will dismiss
 * itself when clicked upon.
 * @param {string} message The message to warn the user about, or an
 *     empty string to dismiss an existing warning message.
 */
monsoon.alpha.Gli.prototype.notifyUser = function(message) {
  var overlay = goog.dom.getElement(monsoon.alpha.Gli.DomIds_.MESSAGE);
  var fromClassName, toClassName;
  if (message) {
    fromClassName = monsoon.alpha.Gli.DomClasses_.HIDE;
    toClassName = monsoon.alpha.Gli.DomClasses_.SHOW;
    goog.dom.setTextContent(overlay, message);
    // Listen for a click on the message, and call ourself to dismiss.
    goog.events.listenOnce(
        overlay,
        goog.events.EventType.CLICK,
        goog.bind(this.notifyUser, this, ''));
  } else {
    fromClassName = monsoon.alpha.Gli.DomClasses_.SHOW;
    toClassName = monsoon.alpha.Gli.DomClasses_.HIDE;
  }
  goog.dom.classes.swap(overlay, fromClassName, toClassName);
};


/**
 * Returns the current externally-accessible model state.
 * @return {!monsoon.alpha.gli.ModelState} The current state of the model,
 *     or {@code null} if not yet set up.
 */
monsoon.alpha.Gli.prototype.getModelState = function() {
  return this.cropModel_.getModelState();
};


/**
 * Updates the crop model, and optionally sets a new crop to model.
 * @param {string=} opt_crop Optional crop to model, or default to
 *     the current crop.
 * @private
 */
monsoon.alpha.Gli.prototype.updateCropModelForCrop_ = function(opt_crop) {
  var controlValues = this.cropModel_.getModelControls();
  controlValues.crop = opt_crop || controlValues.crop;
  this.updateCropModel_(controlValues);
};


/**
 * Updates the crop model to reflect the most recent user control settings.
 * @param {!monsoon.alpha.gli.ModelControls} controlValues The model
 *    controls to use.
 * @private
 */
monsoon.alpha.Gli.prototype.updateCropModel_ = function(controlValues) {
  this.cropModel_.setModelControls(controlValues);
  this.updateWorldGranularityView_();
  this.updateControlsEnabledState_();
};


/**
 * Updates the user controls enable/disable state to reflect the
 * current model state.
 * @private
 */
monsoon.alpha.Gli.prototype.updateControlsEnabledState_ = function() {
  var disableOverrides = !this.getModelState().doesHaveYieldModel;
  var disableOthers = this.cropModel_.getGranularity() ==
      monsoon.alpha.gli.ModelControls.granularity.WORLD;
  disableOverrides = disableOverrides || disableOthers;

  // Enable/disable everthing in our World view controls list.
  for (var control in monsoon.alpha.Gli.DISABLED_IN_WORLD_VIEW_CONTROLS_) {
    var id = monsoon.alpha.Gli.DISABLED_IN_WORLD_VIEW_CONTROLS_[control];
    var element = goog.dom.getElement(id);
    // Management overrides might be disabled for other reasons too.
    if (monsoon.alpha.Gli.MGMT_OVERRIDES_.indexOf(id) >= 0) {
      element.disabled = disableOverrides;
    } else {
      // Check for dynamic controls and enable/disable them too.
      if (id in this.dynamicControlsMap_) {
        this.dynamicControlsMap_[id].setEnabled(!disableOthers);
      } else {
        element.disabled = disableOthers;
      }
    }
  }
};


/**
 * @inheritDoc
 */
monsoon.alpha.Gli.prototype.createSidebar = function() {
  // Set up app menu event handlers
  goog.events.listen(
      goog.dom.getElement(monsoon.alpha.Gli.DomIds_.APP_MENU_SAVE),
      goog.events.EventType.CLICK,
      this.saveScenario_,
      false,
      this);

  // Set up button event handlers
  goog.events.listen(
      goog.dom.getElement(monsoon.alpha.Gli.DomIds_.CLEAR_BUTTON),
      goog.events.EventType.CLICK,
      this.resetScenario_,
      false,
      this);

  // Set up the user inputs to trigger recalculation
  for (var control in monsoon.alpha.Gli.RECALC_INPUT_CONTROLS_) {
    var id = monsoon.alpha.Gli.RECALC_INPUT_CONTROLS_[control];
    var element = goog.dom.getElement(id);
    goog.events.listen(
        element,
        monsoon.alpha.Gli.LOSE_FOCUS_EVENTS_,
        goog.bind(this.inputChanged_, this, id));
    // Set the input's value to reflect the associated ModelControl value.
    this.setInputValue_(id, this.getModelControlValue_(id));
  }

  // For now, disable the Total Yield control
  var totalYield = goog.dom.getElement(monsoon.alpha.Gli.DomIds_.TOTAL_YIELD);
  totalYield.disabled = true;

  // setup the "exploring crops" popup menu
  var dataSources = goog.dom.getElement(monsoon.alpha.Gli.DomIds_.SOURCES);
  var cropsMenuSelect = new goog.ui.Select();
  var cropNames = this.cropModel_.getCropNames();
  for (var i = 0, crop; crop = cropNames[i]; i++) {
    cropsMenuSelect.addItem(new goog.ui.MenuItem(crop));
    if (crop == this.getActiveCrop_()) {
      cropsMenuSelect.setSelectedIndex(i);
    }
  }
  goog.events.listen(
      cropsMenuSelect,
      goog.ui.Component.EventType.ACTION,
      this.cropMenuSelectHandler_,
      false,
      this);
  cropsMenuSelect.render(dataSources);

  // setup the "year" control
  var yearElement = goog.dom.createElement(monsoon.alpha.Gli.DomIds_.LABEL);
  yearElement.id = monsoon.alpha.Gli.DomIds_.YEAR_CONTROL;
  dataSources.appendChild(yearElement);
  var year = this.cropModel_.getYear(this.getActiveCrop_());
  this.updateYearControl_(year);
  this.updateLayerViews_();
};


/**
 * Updates the view controls that show views of our layers.
 * <p>
 * Call this method when layers change, to update the views of those layers.
 * @private
 */
monsoon.alpha.Gli.prototype.updateLayerViews_ = function() {
  this.selectBubbleColorView_(this.getBubbleColorView_());
  this.selectBubbleSizeView_(this.getBubbleSizeView_());

  // Rebuild the "bubble color" popup menu
  this.rebuildLayerPopupMenu_(monsoon.alpha.Gli.DomIds_.COLOR_LAYERS,
      this.getBubbleColorView_(), this.colorMenuSelectHandler_);

  // Rebuild the "bubble size" popup menu
  this.rebuildLayerPopupMenu_(monsoon.alpha.Gli.DomIds_.SIZE_LAYERS,
      this.getBubbleSizeView_(), this.sizeMenuSelectHandler_);

  this.updateControlsEnabledState_();
};


/**
 * Rebuilds a popup menu containing layer views.
 * @param {string} hostElementId The id of the host element to add the menu to.
 * @param {string} viewName The name of the view to select.
 * @param {function(!goog.events.Event)} handler The handler for the select.
 * @private
 */
monsoon.alpha.Gli.prototype.rebuildLayerPopupMenu_ = function(
    hostElementId, viewName, handler) {
  var hostElement = goog.dom.getElement(hostElementId);
  goog.dom.removeChildren(hostElement);
  var popupMenuSelect = new goog.ui.Select();
  var userViewNames = this.availableUserViews_();
  for (var viewIndex = 0, view; view = userViewNames[viewIndex]; viewIndex++) {
    popupMenuSelect.addItem(new goog.ui.MenuItem(view));
  }
  var selectionIndex = userViewNames.indexOf(viewName);
  popupMenuSelect.setSelectedIndex(selectionIndex);
  goog.events.listen(
      popupMenuSelect,
      goog.ui.Component.EventType.ACTION,
      handler,
      false,
      this);
  popupMenuSelect.render(hostElement);
  // Remember our dynamically build controls, for later enable/disable.
  this.dynamicControlsMap_[hostElementId] = popupMenuSelect;
};


/**
 * Generates a list of available user views, based on which layers exist.
 * @return {!Array.<string>} The list of available view names.
 * @private
 */
monsoon.alpha.Gli.prototype.availableUserViews_ = function() {
  var availableViews = [];
  var userViews = monsoon.alpha.Gli.VIEW_NAMES_;
  var userViewNames = userViews.getKeys();
  for (var viewIndex = 0, view; view = userViewNames[viewIndex]; viewIndex++) {
    if (this.cropModel_.getLayer(this.viewNameToLayerName_(view))) {
      availableViews.push(view);
    }
  }
  return availableViews;
};


/**
 * Handles a menu selection in the crop menu.
 * @param {goog.events.Event} e The menu select event object.
 * @private
 */
monsoon.alpha.Gli.prototype.cropMenuSelectHandler_ = function(e) {
  var menuItem = e.target;
  var crop = menuItem.getValue();
  this.cropChanged_(crop);
};


/**
 * Handles a menu selection in the bubble-color menu.
 * @param {!goog.events.Event} e The menu select event object.
 * @private
 */
monsoon.alpha.Gli.prototype.colorMenuSelectHandler_ = function(e) {
  var menuItem = e.target;
  var viewName = menuItem.getValue();
  this.selectBubbleColorView_(viewName);
  this.updateLayerViews_();
};


/**
 * Handles a menu selection in the bubble-size menu.
 * @param {!goog.events.Event} e The menu select event object.
 * @private
 */
monsoon.alpha.Gli.prototype.sizeMenuSelectHandler_ = function(e) {
  var menuItem = e.target;
  var viewName = menuItem.getValue();
  this.selectBubbleSizeView_(viewName);
  this.updateLayerViews_();
};


/**
 * Select which view to show using the bubble color, and redisplay its layer.
 * @param {string} viewName The user-visible name of the bubble color
 *     view to use.
 * @private
 */
monsoon.alpha.Gli.prototype.selectBubbleColorView_ = function(viewName) {
  // We map the bubble-color view onto the bubble-primary layer,
  // and the bubble-area view onto the bubble-secondary layer.
  // If both views point to the same layer, it's the bubble-primary and
  // there is no bubble-secondary.
  var layerName = this.viewNameToLayerName_(viewName);
  var newLayer = this.cropModel_.getLayer(layerName);
  if (!newLayer) {
    // The desired layer is not available, switch to the default
    layerName =
        this.viewNameToLayerName_(monsoon.alpha.Gli.DEFAULT_BUBBLE_COLOR_VIEW_);
    newLayer = this.cropModel_.getLayer(layerName);
  }
  var oldLayer = this.getBubbleColorLayer_();
  if (oldLayer && oldLayer != newLayer) {
    // Check if the view was filling both primary and secondary roles
    if (this.findDisplayLayer(monsoon.maps.MapLayer.Display.BUBBLE_SECONDARY)) {
      this.updateLayer_(oldLayer, monsoon.maps.MapLayer.Display.HIDDEN);
    } else {
      // Since there is no other secondary layer, the old layer should be.
      this.updateLayer_(
          oldLayer, monsoon.maps.MapLayer.Display.BUBBLE_SECONDARY);
    }
  }
  this.updateLayer_(newLayer, monsoon.maps.MapLayer.Display.BUBBLE_PRIMARY);
  this.setBubblePrimaryLayer_(layerName);
};


/**
 * Select which view to show using the bubble size, and redisplay its layer.
 * @param {string} viewName The user-visible name of the bubble size
 *     view to use.
 * @private
 */
monsoon.alpha.Gli.prototype.selectBubbleSizeView_ = function(viewName) {
  var layerName = this.viewNameToLayerName_(viewName);
  var newLayer = this.cropModel_.getLayer(layerName);
  if (!newLayer) {
    // The desired layer is not available, switch to the default
    layerName =
        this.viewNameToLayerName_(monsoon.alpha.Gli.DEFAULT_BUBBLE_SIZE_VIEW_);
    newLayer = this.cropModel_.getLayer(layerName);
  }
  var oldLayer = this.getBubbleSizeLayer_();
  if (oldLayer && oldLayer != newLayer) {
    // Check that the old layer was not filling both roles, and if it was
    // we can just leave it as primary.
    if (oldLayer.getDisplay() != monsoon.maps.MapLayer.Display.BUBBLE_PRIMARY) {
      this.updateLayer_(oldLayer, monsoon.maps.MapLayer.Display.HIDDEN);
    }
  }

  // Check that the selected layer is not already used as the primary
  // layer.  If it is, we can just leave it set as primary and it will
  // display both size and color.
  if (newLayer &&
      newLayer.getDisplay() == monsoon.maps.MapLayer.Display.BUBBLE_PRIMARY) {
    this.updateLayer_(newLayer, monsoon.maps.MapLayer.Display.BUBBLE_PRIMARY);
  } else {
    this.updateLayer_(newLayer, monsoon.maps.MapLayer.Display.BUBBLE_SECONDARY);
  }
  this.setBubbleSecondaryLayer_(layerName);
};


/**
 * Updates the layer's display if the layer exists.
 * @param {monsoon.maps.MapLayer} layer The layer to update.
 * @param {!monsoon.maps.MapLayer.Display=} opt_display The display mode
 *     to apply.
 * @private
 */
monsoon.alpha.Gli.prototype.updateLayer_ = function(layer, opt_display) {
  if (layer) {
    this.updateLayerDisplay(layer, opt_display);
  }
};


/**
 * Gets the current bubble color layer.
 * @return {monsoon.maps.MapLayer} The current bubble color layer,
 *     or {@code undefined} if not found.
 * @private
 */
monsoon.alpha.Gli.prototype.getBubbleColorLayer_ = function() {
  return this.cropModel_.getLayer(this.getColorLayerName_());
};


/**
 * Gets the current bubble size layer.
 * @return {monsoon.maps.MapLayer} The current bubble size layer,
 *     or {@code undefined} if not found.
 * @private
 */
monsoon.alpha.Gli.prototype.getBubbleSizeLayer_ = function() {
  return this.cropModel_.getLayer(this.getSizeLayerName_());
};


/**
 * Updates the control that shows the year being viewed.
 * @param {number} year The year available.
 * @private
 */
monsoon.alpha.Gli.prototype.updateYearControl_ = function(year) {
  // For now we just show the latest year in a static element.
  var yearElement = goog.dom.getElement(monsoon.alpha.Gli.DomIds_.YEAR_CONTROL);
  goog.dom.setTextContent(yearElement, year);
};


/**
 * Resets the user controls for the scenario settings.
 * @private
 */
monsoon.alpha.Gli.prototype.resetScenario_ = function() {
  this.setInputValue_(monsoon.alpha.Gli.DomIds_.PRECIP_CHANGE, null);
  this.setInputValue_(monsoon.alpha.Gli.DomIds_.TEMP_CHANGE, null);
  this.setInputValue_(monsoon.alpha.Gli.DomIds_.TOTAL_YIELD, null);
  this.setMgmtApplied_(monsoon.alpha.gli.MgmtInputs.EMPTY_INPUTS);
  this.clearOverrides_();
  this.refreshView_();
  this.inputChanged_();
};


/**
 * Updates the display for the given layer.
 * <p>
 * If the layer or the map does not exist, nothing is done.
 * @param {string} layerName The name of the layer to update.
 * @param {!monsoon.maps.MapLayer.Display} display The display setting
 *     for the layer.
 * @private
 */
monsoon.alpha.Gli.prototype.updateLayerDisplay_ = function(layerName, display) {
  var layer = this.cropModel_.getLayer(layerName);
  // Don't update unless we have a map.
  if (layer && this.getMap()) {
    this.updateLayerDisplay(layer, display);
  }
};


/**
 * Refreshes the current view.
 * @private
 */
monsoon.alpha.Gli.prototype.refreshView_ = function() {
  this.updateLayerDisplay_(
      this.getColorLayerName_(),
      monsoon.maps.MapLayer.Display.BUBBLE_PRIMARY);
  // We don't need to refesh the BUBBLE_SECONDARY layer, since the primary
  // and secondary layers work together to provide the color/size views.
};


/**
 * Gets the current crop being modeled.
 * @return {string} The common name for the crop being modeled.
 * @private
 */
monsoon.alpha.Gli.prototype.getActiveCrop_ = function() {
  return this.cropModel_.getModelControls().crop;
};


/**
 * Handles a change in one of the user inputs.
 * @param {string=} opt_inputId Optional id of the input element that changed.
 *     When not supplied it's assumed that general changes were made.
 * @private
 */
monsoon.alpha.Gli.prototype.inputChanged_ = function(opt_inputId) {
  var newPrecip = this.getInputValue_(monsoon.alpha.Gli.DomIds_.PRECIP_CHANGE);
  var newTemp = this.getInputValue_(monsoon.alpha.Gli.DomIds_.TEMP_CHANGE);
  var totalYield = this.getInputValue_(monsoon.alpha.Gli.DomIds_.TOTAL_YIELD);
  var overrides = this.getOverrides_();
  var component = this.mgmtComponentOfInput_(opt_inputId);
  if (opt_inputId && component != null) {
    var value = this.getInputValue_(opt_inputId);
    overrides = this.addOverride_(component, value);
  }
  var controls = new monsoon.alpha.gli.ModelControls(
      this.getActiveCrop_(), newPrecip, newTemp, totalYield, overrides,
      this.cropModel_.getGranularity());
  var message = this.cropModel_.checkScenarioSanity(controls);
  if (message != null) {
    this.setDisplayBarText_([message]);
  } else {
    // apply the changes
    this.updateCropModel_(controls);
    this.updateLayerViews_();
    this.dataChanged();
  }
};


/** @inheritDoc */
monsoon.alpha.Gli.prototype.createDisplaybar = function() {
  // currently unused
};


/** @inheritDoc */
monsoon.alpha.Gli.prototype.notifyMapChanged = function() {
  this.dataChanged();
};


/** @inheritDoc */
monsoon.alpha.Gli.prototype.dataChanged = function() {
  // Sometimes the arrival of data is our only notificaiton that the map
  // was just created.  Call mapChanged in this case.
  // TODO: use events to provide a cleaner notificaiton when the map is shown.
  if (this.showingMap_ != !!this.getMap()) {
    this.showingMap_ = !!this.getMap();
    this.mapChanged();
  }

  if (this.cropModel_.getGranularity() ==
      monsoon.alpha.gli.ModelControls.granularity.LOCAL) {
    // TODO: consider putting the scenario aggregate in the data model.
    var scenarioAggregate = this.scenarioAggregate_();
    if (scenarioAggregate) {
      this.setDisplayBarText_(this.displayScenarioData_(scenarioAggregate));
    }
    this.refreshView_();
  }
};


/**
 * Handles a change in which crop we're viewing.
 * @param {Object} crop The new crop to view.
 * @private
 */
monsoon.alpha.Gli.prototype.cropChanged_ = function(crop) {
  this.showLoadingMessage_();
  var year = this.cropModel_.getYear(crop);
  if (year) {
    this.updateYearControl_(year);
    this.updateCropModelForCrop_(crop);
    this.updateLayerViews_();
  }
};


/**
 * Shows the "loading..." message to tell the user data is not available.
 * @private
 */
monsoon.alpha.Gli.prototype.showLoadingMessage_ = function() {
  this.setDisplayBarText_([monsoon.alpha.Gli.LOADING_MESSAGE_]);
};


/**
 * Sets the text of the display bar to the list of lines specified, inserting
 * line breaks between each line.
 * @param {Array.<string>} stringWithBreaks The lines to display.
 * @private
 */
monsoon.alpha.Gli.prototype.setDisplayBarText_ = function(stringWithBreaks) {
  var displayBar = goog.dom.getElement(
      monsoon.alpha.Gli.DomIds_.DISPLAY_BAR_CONTENT);
  if (displayBar && stringWithBreaks) {
    goog.dom.removeChildren(displayBar);
    for (var i = 0, line; line = stringWithBreaks[i]; i++) {
      goog.dom.appendChild(displayBar, goog.dom.createTextNode(line));
      goog.dom.appendChild(displayBar, goog.dom.createElement('br'));
    }
  }
};


/**
 * Callback when the user mouses over a cell to show cell details.
 * @param {number} lat The cell's latitude.
 * @param {number} lon The cell's longitude.
 * @private
 */
monsoon.alpha.Gli.prototype.hover_ = function(lat, lon) {
  // TODO: create a floating tooltip window instead of changing data
  // in the display bar.  Once that's done we won't need hoverLeave_
  this.setDisplayBarText_(this.displayCellData_(lat, lon));
};


/**
 * Callback when the mouse is no longer over a cell, to stop showing
 * cell details.
 * @private
 */
monsoon.alpha.Gli.prototype.hoverLeave_ = function() {
  this.dataChanged();
};


/**
 * Pushes a description of the value onto the array by applying the given label.
 * If the value is falsey, then nothing is pushed.
 * If the value is a number it limits the displayed precision to our default.
 * @param {!Array.<string>} array The array to push onto.
 * @param {string} label A label to apply.
 * @param {Object} value The value to label and push.
 * @private
 */
monsoon.alpha.Gli.prototype.maybePushDescription_ =
    function(array, label, value) {
  var valueToShow = value;
  if (typeof(valueToShow) == 'number') {
    valueToShow = value.toPrecision(this.PRECISION_);
  }
  if (valueToShow != null) {
    array.push(label + valueToShow);
  }
};

/**
 * Computes display data for the display bar based on a single cell.
 * @param {number} lat The cell's latitude.
 * @param {number} lon The cell's longitude.
 * @return {!Array.<string>} The text lines to display.
 * @private
 */
monsoon.alpha.Gli.prototype.displayCellData_ = function(lat, lon) {
  var latlng = new google.maps.LatLng(lat, lon);
  var data = [];
  var scenarioDatum = this.cropModel_.computeScenarioDatum(latlng);
  var scenarioCrop = scenarioDatum.getScenarioCropDatum();

  this.maybePushDescription_(
      data, 'yield: ', scenarioCrop.getYield());
  this.maybePushDescription_(data, 'area: ', scenarioDatum.getArea());
  this.maybePushDescription_(
      data, 'production: ', scenarioDatum.getProduction());
  this.showMgmt_(data, 'management: ', scenarioCrop.getMgmtInputs());
  this.showMgmt_(data, 'excess: ', scenarioCrop.getMgmtExcess());

  return data;
};


/**
 * Pushes a description of a component of a management input using the
 * name of the component and the given label.
 * @param {!Array.<string>} data The array to push the description onto.
 * @param {string} label The label to use for the description, which
 *     is prefixed by the name of the management component.
 * @param {!monsoon.alpha.gli.MgmtInputs} mgmt The management inputs to
 *     get the value of the component from.
 * @private
 */
monsoon.alpha.Gli.prototype.showMgmt_ = function(data, label, mgmt) {
  var values = [];
  for (var compEnum in monsoon.alpha.gli.MgmtInputs.MgmtComponent) {
    var comp = monsoon.alpha.gli.MgmtInputs.MgmtComponent[compEnum];
    var value = mgmt.getInputsVector()[comp];
    values.push(compEnum + ': ' + value);
  }
  this.maybePushDescription_(data, label, values.join(', '));
};


/**
 * Computes display data from the scenario under consideration.
 * @param {!monsoon.alpha.gli.ScenarioAggregate} scenarioAggregate The aggregate
 *     scenario data to display from.
 * @return {!Array.<string>} A list of strings describing various statistics.
 * @private
 */
monsoon.alpha.Gli.prototype.displayScenarioData_ = function(scenarioAggregate) {
  var descriptions = [];
  descriptions.push('Total cells: ' + scenarioAggregate.getBaseYieldCount());
  this.maybePushDescription_(
      descriptions,
      'Total production: ',
      scenarioAggregate.getBaseProductionTotal().toFixed(2));
  this.maybePushDescription_(
      descriptions,
      'Average area: ',
      scenarioAggregate.getAreaAverage().toFixed(2));
  this.maybePushDescription_(
      descriptions,
      'Fertilizer applied: ',
      scenarioAggregate.getBaseFertilizer().toFixed(2));
  this.maybePushDescription_(
      descriptions,
      'Excess nutrients: ',
      scenarioAggregate.getBaseExcess().toFixed(2));
  this.showMgmt_(
      descriptions, 'applied: ', scenarioAggregate.getBaseMgmtApplied());
  this.showMgmt_(
      descriptions, 'excess: ', scenarioAggregate.getBaseMgmtExcess());
  this.setTotalYield_(scenarioAggregate.getScenarioYieldAverage());
  this.maybePushDescription_(
      descriptions,
      'Scenario production: ',
      scenarioAggregate.getScenarioProductionTotal().toFixed(2));
  this.maybePushDescription_(
      descriptions,
      'Scenario applied: ',
      scenarioAggregate.getScenarioFertilizer().toFixed(2));
  this.maybePushDescription_(
      descriptions,
      'Scenario excess: ',
      scenarioAggregate.getScenarioExcess().toFixed(2));
  this.setMgmtApplied_(scenarioAggregate.getScenarioMgmtApplied());
  this.showMgmt_(descriptions, 'scenario excess: ',
      scenarioAggregate.getScenarioMgmtExcess());
  this.maybePushDescription_(
      descriptions,
      'Cells increasing: ',
      scenarioAggregate.getIncreasingCount());
  this.maybePushDescription_(
      descriptions,
      'Cells decreasing: ',
      scenarioAggregate.getDecreasingCount());
  this.maybePushDescription_(
      descriptions,
      'Average increase in yield: ',
      scenarioAggregate.getAverageIncrease());
  this.maybePushDescription_(
      descriptions,
      'Average decrease in yield: ',
      scenarioAggregate.getAverageDecrease());
  this.maybePushDescription_(
      descriptions,
      'Average yield change: ',
      scenarioAggregate.getAverageYieldChange().toFixed(2));
  this.maybePushDescription_(
      descriptions,
      'Production change: ',
      scenarioAggregate.getProductionChange().toFixed(2));
  this.maybePushDescription_(
      descriptions,
      'Incomplete data count: ',
      scenarioAggregate.getIncompleteDataCount().toFixed(2));
  return descriptions;
};


/**
 * Computes an array of climate change yields for all the cells in
 * the entire area under cultivation for the current scenario.
 * @return {Array.<monsoon.alpha.gli.ScenarioDatum>} An array of scenario data
 *     points covering some area.
 * @private
 */
monsoon.alpha.Gli.prototype.scenarioDataPoints_ = function() {
  var cellLatLngs = this.mapCellsSelected_();
  if (cellLatLngs.length == 0) {
    cellLatLngs = this.mapCellLocationsInView_();
  }
  if (cellLatLngs && cellLatLngs.length > 0) {
    var scenarioDataPoints = [];
    for (var i = 0, cellLatLng; cellLatLng = cellLatLngs[i]; i++) {
      scenarioDataPoints.push(
          this.cropModel_.computeScenarioDatum(cellLatLng));
    }
    return scenarioDataPoints;
  }
  return null;
};


/**
 * Gets an array of map cell locations in the current view.
 * Uses the current map bounds to determine which cells are in the view.
 * @return {!Array.<google.maps.LatLng>} An array of lat/lng objects.
 * @private
 */
monsoon.alpha.Gli.prototype.mapCellLocationsInView_ = function() {
  var layer = this.firstVisibleLayer();
  if (layer) {
    return this.getMapCellLatLngs(layer);
  } else {
    return [];
  }
};


/**
 * Gets an array of map cell locations that the user has selected.
 * @return {!Array.<google.maps.LatLng>} An array of lat/lng objects.
 * @private
 */
monsoon.alpha.Gli.prototype.mapCellsSelected_ = function() {
  var latlngs = [];
  var tileKeys = this.view_.getSelectedCells();
  for (var i = 0, tileKey; tileKey = tileKeys[i]; i++) {
    var latlng = monsoon.maps.Util.tileKeyToLatLng(tileKey);
    latlngs.push(latlng);
  }
  return latlngs;
};


/**
 * Handles a click in a cell by selecting or deselecting the cell.
 * @param {!google.maps.MVCObject} cell The cell that was clicked.
 * @private
 */
monsoon.alpha.Gli.prototype.cellClickHandler_ = function(cell) {
  this.view_.toggleSelectedCell(cell);
  this.redrawCellSelectedIndicator_(cell);
  this.dataChanged();
};


/**
 * Redraws the given cell to update the indication of whether it is currently
 * selected or not.
 * @param {!google.maps.MVCObject} cell The cell to redraw.
 * @private
 */
monsoon.alpha.Gli.prototype.redrawCellSelectedIndicator_ = function(cell) {
  var isSelected = this.view_.isSelected(cell.tile);
  cell.setOptions({strokeWeight: this.getCellStrokeWeight_(isSelected)});
};


/**
 * Gets the stroke weight (outline thickness) to use when drawing a cell,
 * given the selected-state.
 * @param {boolean} isSelected The selected-state being requested.
 * @return {number} The stroke weight to use for the given selected-state.
 * @private
 */
monsoon.alpha.Gli.prototype.getCellStrokeWeight_ = function(isSelected) {
  return isSelected ? monsoon.alpha.Gli.CELL_STROKE_WEIGHT_SELECTED_ :
      monsoon.alpha.Gli.CELL_STROKE_WEIGHT_;
};


/**
 * Computes aggregate data reflecting the entire area under cultivation for
 * the current scenario.
 * @return {monsoon.alpha.gli.ScenarioAggregate} The aggregate data for
 *     the scenario.
 * @private
 */
monsoon.alpha.Gli.prototype.scenarioAggregate_ = function() {
  var datapoints = this.scenarioDataPoints_();
  if (datapoints) {
    return new monsoon.alpha.gli.ScenarioAggregate(
        datapoints, this.getModelState());
  }
  return null;
};


/** @inheritDoc */
monsoon.alpha.Gli.prototype.createCell = function(cellInfo) {
  return this.createOrUpdateCell_(cellInfo);
};


/** @inheritDoc */
monsoon.alpha.Gli.prototype.updateCell = function(cellInfo) {
  this.createOrUpdateCell_(cellInfo);
};


/**
 * Creates a new cell, or updates an existing cell, base on the supplied
 * cell info.
 * @param {!monsoon.maps.CellInfo} cellInfo The information describing what
 *     the cell should look like.
 * @return {google.maps.MVCObject} The circle created, or {@code null} if
 *     only an update was required.
 * @private
 */
monsoon.alpha.Gli.prototype.createOrUpdateCell_ = function(cellInfo) {
  var lat = cellInfo.getLat();
  var lng = cellInfo.getLng();
  var latDelta = cellInfo.latDelta;
  var lngDelta = cellInfo.lngDelta;
  var relativeSize = cellInfo.size;
  var center = new google.maps.LatLng(lat, lng);

  if (monsoon.alpha.Gli.SKIP_CELL_CREATION_) {
    return null;
  }

  // This calculation of radius is based on the assumption
  // that one degree equals 111 km which is only true on the equator.
  var radiusDegrees = Math.min(latDelta, lngDelta) / 2;
  var radiusMeters = radiusDegrees * 111000;
  radiusMeters *= relativeSize;

  var options = {
    center: center,
    radius: radiusMeters,
    strokeColor: '#005500',
    strokeOpacity: 0.8,
    strokeWeight: this.getCellStrokeWeight_(
        this.view_.isSelected(cellInfo.tile)),
    fillColor: cellInfo.fillColor,
    fillOpacity: 0.35
  };

    var squareSize = 0.25/6.0;
    var squareCoords = [
                        new google.maps.LatLng(lat - squareSize, lng - squareSize),
                        new google.maps.LatLng(lat - squareSize, lng + squareSize),
                        new google.maps.LatLng(lat + squareSize, lng + squareSize),
                        new google.maps.LatLng(lat + squareSize, lng - squareSize),
                        new google.maps.LatLng(lat - squareSize, lng - squareSize)
                        ];
    
    var squareOptions = {
    paths: squareCoords,
    strokeColor: "#FF0000",
    strokeOpacity: 0.1,
    strokeWeight: 1,
    fillColor: cellInfo.fillColor,
    fillOpacity: 0.30
    };
    
    
  var cell = cellInfo.tile.cell;
  if (cellInfo.isUpdate) {
    //cell.setOptions(options);
    cell.setOptions(squareOptions);
    return null;
  } else {
    // Constructs the circle.
    //cell = new google.maps.Circle(options);
    cell = new google.maps.Polygon(squareOptions);

    // Add listeners for hovering the mouse over each cell
    google.maps.event.addListener(
        cell,
        goog.events.EventType.MOUSEOVER,
        goog.bind(this.hover_, this, lat, lng));
    google.maps.event.addListener(
        cell,
        goog.events.EventType.MOUSEOUT,
        goog.bind(this.hoverLeave_, this));

    // Add a click listener for the cell
    google.maps.event.addListener(
        cell,
        goog.events.EventType.CLICK,
        goog.bind(this.cellClickHandler_, this, cell));

    return cell;
  }
};


/** @inheritDoc */
monsoon.alpha.Gli.prototype.createPoint = function(pointInfo) {
    
  var lat = pointInfo.getLat();
  var lng = pointInfo.getLng();
  var text = pointInfo.value;
  var marker = new google.maps.Marker({
    position: new google.maps.LatLng(lat, lng),
    title: text
  });
  return marker;
   
};



/** @inheritDoc */
monsoon.alpha.Gli.prototype.createSquares = function(pointInfo) {
    var lat = pointInfo.getLat();
    var lng = pointInfo.getLng();
    var text = pointInfo.value;
    
    //
    var squareSize = 0.5/6.0;
    var squareCoords = [
                          new google.maps.LatLng(lat - squareSize, lng - squareSize),
                          new google.maps.LatLng(lat - squareSize, lng + squareSize),
                          new google.maps.LatLng(lat + squareSize, lng + squareSize),
                          new google.maps.LatLng(lat + squareSize, lng - squareSize),
                          new google.maps.LatLng(lat - squareSize, lng - squareSize)
                          ];
    
    var sqaureOptions = {
    paths: squareCoords,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: cellInfo.fillColor,
    fillOpacity: 0.35
    };
    
    var squareElem = new google.maps.Polygon(sqaureOptions);

    return squareElem;
};



/** @inheritDoc */
monsoon.alpha.Gli.prototype.createInfoWindowContent = function(cell) {
  // TODO: Implement specific InfoWindow content and update on loading
  // new layers

  var tile = cell.tile;
  var data = this.displayCellData_(tile.lat, tile.lng);

  var infoContent = goog.dom.createDom('div');
  for (var i = 0, line; line = data[i]; i++) {
    goog.dom.appendChild(infoContent, goog.dom.createTextNode(line));
    goog.dom.appendChild(infoContent, goog.dom.createElement('br'));
  }

  return infoContent;
};


/**
 * Sets the value of the 'total yield' input.
 * @param {?number} value The value to set the input control to.  Use
 *     {@code null} to reset the value to the default.
 * @private
 */
monsoon.alpha.Gli.prototype.setTotalYield_ = function(value) {
  this.setInputValue_(monsoon.alpha.Gli.DomIds_.TOTAL_YIELD, value);
};


/**
 * Sets the value of an input.
 * @param {string} elementId The input control's element ID.
 * @param {?number} value The value to set the input control to.  Use
 *     {@code null} to reset the value to the default.
 * @private
 */
monsoon.alpha.Gli.prototype.setInputValue_ = function(elementId, value) {
  var element = goog.dom.getElement(elementId);
  element.value = value;
};


/**
 * Gets an input control's value.
 * @param {string} elementId The input control's element ID.
 * @return {number} The value of the control, as set by the user.
 * @private
 */
monsoon.alpha.Gli.prototype.getInputValue_ = function(elementId) {
  var element = goog.dom.getElement(elementId);
  var value = 0;
  if (element.value) {
    value = Number(element.value);
  }
  return value;
};


/**
 * Gets a value from the {@code ModelControl} associated with the given
 * element ID of an input element.
 * @param {string} elementId The input control's element ID.
 * @return {number} The current setting from the Model.
 * @private
 */
monsoon.alpha.Gli.prototype.getModelControlValue_ = function(elementId) {
  var modelControls = this.cropModel_.getModelControls();
  // Map the input to the associated model control.
  var controlName = monsoon.alpha.Gli.INPUTS_TO_MODEL_[elementId];
  return modelControls.getMemberState(controlName);
};


/**
 * Returns the management component associated with an input control ID.
 * @param {?string} inputId The input control's dom ID.
 * @return {monsoon.alpha.gli.MgmtInputs.MgmtComponent} The associated
 *     management input, or {@code null} if none is associated.
 * @private
 */
monsoon.alpha.Gli.prototype.mgmtComponentOfInput_ = function(inputId) {
  if (inputId == monsoon.alpha.Gli.DomIds_.NITROGEN) {
    return monsoon.alpha.gli.MgmtInputs.MgmtComponent.N;
  } else if (inputId == monsoon.alpha.Gli.DomIds_.PHOSPHORUS) {
    return monsoon.alpha.gli.MgmtInputs.MgmtComponent.P;
  } else if (inputId == monsoon.alpha.Gli.DomIds_.POTASSIUM) {
    return monsoon.alpha.gli.MgmtInputs.MgmtComponent.K;
  } else if (inputId == monsoon.alpha.Gli.DomIds_.IRRIGATION) {
    return monsoon.alpha.gli.MgmtInputs.MgmtComponent.I;
  }
  return null;
};


/**
 * Sets the various management input controls to show the specified inputs.
 * @param {monsoon.alpha.gli.MgmtInputs} mgmtInputs The inputs whose values
 *     we should show in the management input controls.
 * @private
 */
monsoon.alpha.Gli.prototype.setMgmtApplied_ = function(mgmtInputs) {
  if (mgmtInputs) {
    this.setInputValue_(
        monsoon.alpha.Gli.DomIds_.NITROGEN, mgmtInputs.getNitrogen());
    this.setInputValue_(
        monsoon.alpha.Gli.DomIds_.PHOSPHORUS, mgmtInputs.getPhosphorus());
    this.setInputValue_(
        monsoon.alpha.Gli.DomIds_.POTASSIUM, mgmtInputs.getPotassium());
    this.setInputValue_(
        monsoon.alpha.Gli.DomIds_.IRRIGATION, mgmtInputs.getIrrigation());
  }
};


/**
 * Adds a management override to the existing management overrides of the
 * model state.
 * @param {!monsoon.alpha.gli.MgmtInputs.MgmtComponent} component The
 *     management component to override.
 * @param {number} value The value to use as an override for the associated
 *     management component.
 * @return {!monsoon.alpha.gli.MgmtInputs} The updated overrides.
 * @private
 */
monsoon.alpha.Gli.prototype.addOverride_ = function(component, value) {
  var overrides = this.getOverrides_();
  if (!overrides) {
    overrides = new monsoon.alpha.gli.MgmtInputs(
        monsoon.alpha.gli.ModelControls.NO_OVERRIDES);
  }
  overrides.setComponent(component, value);
  return overrides;
};


/**
 * Gets the current management overrides.
 * @return {!monsoon.alpha.gli.MgmtInputs} The current overrides, with
 *     each component either a number which overrides the input, or
 *     {@code null} indicating no override.
 * @private
 */
monsoon.alpha.Gli.prototype.getOverrides_ = function() {
  return this.cropModel_.getModelControls().mgmtOverrides;
};


/**
 * Clears the management overrides.
 * @private
 */
monsoon.alpha.Gli.prototype.clearOverrides_ = function() {
  var overrides = this.cropModel_.getModelControls().clearOverrides();
};


/**
 * Saves the scenario state by sending serialized state to the server.
 * @private
 */
monsoon.alpha.Gli.prototype.saveScenario_ = function() {
  this.getDbBridge().postToServer(
      {'scenario_params': goog.json.serialize(this.getCurrentState())},
      '/save',
      goog.bind(this.saveScenarioResponseHandler_, this));
};


/**
 * Checks the status of the server response and if OK, updates the link to
 * the saved scenario.
 * @param {!Object} responseJson JSON response from the server.
 * @private
 */
monsoon.alpha.Gli.prototype.saveScenarioResponseHandler_ = function(
    responseJson) {
  var status = responseJson.status;
  if (status == 'OK') {
    this.updateSavedScenarioLink_(responseJson.payload.scenario_id);
  } else {
    this.notifyUser('Server error: ' + responseJson.payload.message);
  }
};


/**
 * Shows a link to saved scenario to the user.
 * @param {string} scenarioId Scenario id to be used in constructing the link.
 * @private
 */
monsoon.alpha.Gli.prototype.updateSavedScenarioLink_ = function(scenarioId) {
  var url = monsoon.alpha.Gli.SAVED_SCENARIO_URL_PREFIX_ + scenarioId;
  var linkElement = goog.dom.createDom(
      'a',
      {'href': url, 'id': monsoon.alpha.Gli.DomIds_.APP_MENU_SAVED_LINK_AREA},
      monsoon.alpha.Gli.SAVED_SCENARIO_TEXT_);
  goog.dom.replaceNode(
      linkElement,
      goog.dom.getElement(monsoon.alpha.Gli.DomIds_.APP_MENU_SAVED_LINK_AREA));
};


/**
 * Loads the scenario state after requesting serialized state from the server.
 * @param {string} scenarioId Scenario id to be loaded from the server.
 * @private
 */
monsoon.alpha.Gli.prototype.loadScenario_ = function(scenarioId) {
  this.getDbBridge().postToServer(
      {'scenario_id': scenarioId},
      '/load',
      goog.bind(this.loadScenarioResponseHandler_, this));
};


/**
 * Checks the status of server response and if OK, sets up the GLI page
 * with the state received from the server.
 * @param {!Object} responseJson JSON response from the server.
 * @private
 */
monsoon.alpha.Gli.prototype.loadScenarioResponseHandler_ = function(
    responseJson) {
  var status = responseJson.status;
  if (status == 'OK') {
    var json = responseJson.payload.scenario_params_json;
    if (json) {
      var state = goog.json.parse(json);
      this.setCurrentState(state);
    } else {
      this.notifyUser(monsoon.alpha.Gli.CANT_LOAD_MESSAGE_);
    }
    this.setUpMonsoonMapPage();
  }
};

/**
 * Retrieves a value from a DOM element of a given id and sets it as an
 * attribute of the same name as the id.
 * @param {!Object} result Object to which the attribute will be added.
 * @param {string} domId Id of the DOM node from which the value will be read.
 * @private
 */
monsoon.alpha.Gli.prototype.addInputValueToResult_ = function(result, domId) {
  result[domId] = this.getInputValue_(domId);
};


/** @inheritDoc */
monsoon.alpha.Gli.prototype.getCurrentState = function() {
  var baseResult = goog.base(this, 'getCurrentState');
  var result = {'base': baseResult};
  result['crop_model'] = this.cropModel_.getCurrentState();
  result['view'] = this.view_.getCurrentState();
  return result;
};


/** @inheritDoc */
monsoon.alpha.Gli.prototype.setCurrentState = function(state) {
  // First set the state of the parent (i.e., the map).
  goog.base(this, 'setCurrentState', state.base);
  this.cropModel_.setCurrentState(state['crop_model']);
  this.view_.setCurrentState(state['view']);
};


// TODO: move this section into a separate View class.


/**
 * Gets the current bubble-color view's name.
 * @return {string} The current bubble-color view's name.
 * @private
 */
monsoon.alpha.Gli.prototype.getBubbleColorView_ = function() {
  return this.view_.colorViewName_;
};


/**
 * Sets the current bubble color view's name.
 * @param  {string} colorViewName The new bubble color view's name.
 * @private
 */
monsoon.alpha.Gli.prototype.setBubbleColorView_ = function(colorViewName) {
  this.view_.colorViewName_ = colorViewName;
};


/**
 * Sets the current bubble size view's name.
 * @param  {string} sizeViewName The new bubble size view's name.
 * @private
 */
monsoon.alpha.Gli.prototype.setBubbleSizeView_ = function(sizeViewName) {
  this.view_.sizeViewName_ = sizeViewName;
};


/**
 * Gets the current bubble-size view's name.
 * @return {string} The current bubble-size view's name.
 * @private
 */
monsoon.alpha.Gli.prototype.getBubbleSizeView_ = function() {
  return this.view_.sizeViewName_;
};


/**
 * Gets the bubble color layer name used by the crop model.
 * @return {string} The layer name used for the bubble color layer.
 * @private
 */
monsoon.alpha.Gli.prototype.getColorLayerName_ = function() {
  return this.viewNameToLayerName_(this.getBubbleColorView_());
};


/**
 * Gets the bubble size layer name used by the crop model.
 * @return {string} The layer name used for the bubble size layer.
 * @private
 */
monsoon.alpha.Gli.prototype.getSizeLayerName_ = function() {
  return this.viewNameToLayerName_(this.getBubbleSizeView_());
};


/**
 * Sets the bubble's primary layer based on the given layer name.
 * @param {string} layerName The name of the layer to be the new primary layer.
 * @private
 */
monsoon.alpha.Gli.prototype.setBubblePrimaryLayer_ = function(layerName) {
  // The color view is mapped to the primary layer.
  this.setBubbleColorView_(this.layerNameToViewName_(layerName));
};


/**
 * Sets the bubble's secondary layer based on the given layer name.
 * @param {string} layerName The name of the layer to be the new secondary
 *     layer.
 * @private
 */
monsoon.alpha.Gli.prototype.setBubbleSecondaryLayer_ = function(layerName) {
  // The size view is mapped to the secondary layer.
  this.setBubbleSizeView_(this.layerNameToViewName_(layerName));
};


/**
 * Converts a layer name into a view name.
 * @param {string} layerName The internal layer name.
 * @return {string} The user-visible view name of the layer,
 *     or {@code null} if not found.
 * @private
 */
monsoon.alpha.Gli.prototype.layerNameToViewName_ = function(layerName) {
  var userViewNames = monsoon.alpha.Gli.VIEW_NAMES_.getKeys();
  for (var viewIndex = 0, view; view = userViewNames[viewIndex]; viewIndex++) {
    if (monsoon.alpha.Gli.VIEW_NAMES_.get(view) == layerName) {
      return view;
    }
  }
  return null;
};


/**
 * Converts a user-visible view name into an internal layer name used
 * by the crop model.
 * @param {string} viewName The user-visible layer name.
 * @return {string} The internal name of the layer used by the crop model,
 *     or {@code undefined} if not found.
 * @private
 */
monsoon.alpha.Gli.prototype.viewNameToLayerName_ = function(viewName) {
  return monsoon.alpha.Gli.VIEW_NAMES_.get(viewName);
};

// TODO: move the GliView class into a separate file.



/**
 * The view state used by this class.
 * <p>
 * Although this class is tiny, it contains all the view controls that need
 * to be serialized in order to save/restore the view onto the model.
 * @constructor
 */
monsoon.alpha.gli.GliView = function() {
  /**
   * The name of the view that is displayed using the bubble color.
   * @type {string}
   * @private
   */
  this.colorViewName_ = monsoon.alpha.Gli.DEFAULT_BUBBLE_COLOR_VIEW_;

  /**
   * The name of the view that is displayed using the bubble size.
   * @type {string}
   * @private
   */
  this.sizeViewName_ = monsoon.alpha.Gli.DEFAULT_BUBBLE_SIZE_VIEW_;

  /**
   * The cells currently selected by the user.
   * The set of selected cells are stored as an object whose properties
   * are {@code tileKey} string objects for each selected cell.
   * The property keys are also the tile keys.
   * @type {!Object}
   * @private
   * @see monsoon.maps.Tile.prototype.getKey
   */
  this.selection_ = {};
};


/**
 * Gets the current state of this object in a form that can be persisted.
 * @return {!Object} A state that can be persisted, and restored
 *     with {@link #setCurrentState}.
 */
monsoon.alpha.gli.GliView.prototype.getCurrentState = function() {
  return {
      'bubble_color_view': this.colorViewName_,
      'bubble_size_view': this.sizeViewName_,
      'selected_cells': this.getSelectedCellsState_()
  };
};


/**
 * Sets the current state from the supplied persisted form.
 * @param {Object} state The persisted state to set in this object.
 */
monsoon.alpha.gli.GliView.prototype.setCurrentState = function(state) {
  if (state) {
    this.colorViewName_ = state['bubble_color_view'] || this.colorViewName_;
    this.sizeViewName_ = state['bubble_size_view'] || this.sizeViewName_;
    this.setSelectedCellsState_(state['selected_cells']);
  }
};


/**
 * Gets an array of the selected cell lat/lng positions.
 * @return {!Array.<string>} An array of tile key strings.
 */
monsoon.alpha.gli.GliView.prototype.getSelectedCells = function() {
  return goog.object.getValues(this.selection_);
};


/**
 * Gets a persistable form of the selected cells.
 * @return {!Array.<string>} An array of tile key values.
 * @private
 */
monsoon.alpha.gli.GliView.prototype.getSelectedCellsState_ = function() {
  var cellLatLngList = [];
  for (var key in this.selection_) {
    var entry = this.selection_[key];
    cellLatLngList.push(entry);
  }
  return cellLatLngList;
};


/**
 * Sets the selected cells from the persisted form..
 * @param {!Array.<string>} selectionState An array of tile key strings.
 * @private
 */
monsoon.alpha.gli.GliView.prototype.setSelectedCellsState_ = function(
    selectionState) {
  var newSelection = {};
  while (selectionState && selectionState.length > 0) {
    var tileKey = selectionState.shift();
    newSelection[tileKey] = tileKey;
  }
  this.selection_ = newSelection;
};


/**
 * Toggles the given cell's selection-state.
 * @param {!google.maps.MVCObject} cell The cell whose selection-state should
 *     be toggled.
 */
monsoon.alpha.gli.GliView.prototype.toggleSelectedCell = function(cell) {
  var tileKey = cell.tile.getKey();
  if (tileKey in this.selection_) {
    delete this.selection_[tileKey];
  } else {
    this.selection_[tileKey] = tileKey;
  }
};


/**
 * Tells whether the cell associated with the given tile is selected or not.
 * @param {!monsoon.maps.Tile} tile The tile associated with the cell
 *     to check if selected.
 * @return {boolean} Whether the cell is selected.
 */
monsoon.alpha.gli.GliView.prototype.isSelected = function(tile) {
  return tile.getKey() in this.selection_;
};
