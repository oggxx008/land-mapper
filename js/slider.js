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
 * @fileoverview Code to create slider elements for monsoon. A single slider
 * with output and labels is provided, along with a slider stack, which is a
 * container for three sliders to be used in the GLI scenario page.
 * @author Kevin Zhang
 */

goog.provide('monsoon.ui.Slider');
goog.provide('monsoon.ui.SliderOptions');
goog.provide('monsoon.ui.SliderStack');

goog.require('goog.dom');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Slider');



/**
 * TODO: Sliders don't seem to move to the correct location after
 * updating the value.
 * Container object for storing options for {@code monsoon.ui.Slider}. Either
 * SliderOptions or an object with key/value pairs of the required parameters
 * can be used to set up a {@code monsoon.ui.Slider}.
 * @constructor
 */
monsoon.ui.SliderOptions = function() {};

/**
 * The minimum slider value.
 * @type {number}
 */
monsoon.ui.SliderOptions.prototype.min;

/**
 * The maximum slider value.
 * @type {number}
 */
monsoon.ui.SliderOptions.prototype.max;

/**
 * The starting slider value.
 * @type {number}
 */
monsoon.ui.SliderOptions.prototype.start;

/**
 * The title label for the slider.
 * @type {string}
 */
monsoon.ui.SliderOptions.prototype.label;

/**
 * The units label for the slider.
 * @type {string}
 */
monsoon.ui.SliderOptions.prototype.units;

/**
 * The minimum increment when the slider is moved.
 * @type {number}
 */
monsoon.ui.SliderOptions.prototype.step;



/**
 * Creates a slider for monsoon with labels.
 * @param {Object|monsoon.ui.SliderOptions} options The settings for the slider.
 * @constructor
 */
monsoon.ui.Slider = function(options) {

  /**
   * Slider object for this monsoon slider.
   * @type {goog.ui.Slider}
   * @private
   */
  this.slider_ = null;

  /**
   * DOM element for this monsoon slider.
   * @type {Element}
   * @private
   */
  this.element_ = null;

  /**
   * Settings for the monsoon slider.
   * @type {Object|monsoon.ui.SliderOptions}
   * @private
   */
  this.options_ = options;

  // Initializes the slider without rendering the HTML.
  this.reset();
};


/**
 * Monsoon slider setup. Creates the DOM structure, initializes the slider,
 * sets the bindings, and updates the display. Called in the constructor but
 * can be used to reset the slider.
 */
monsoon.ui.Slider.prototype.reset = function() {
  this.createDom_();
  this.setupSlider_();
  this.setBindings_();
  this.updateDisplay();
};


/**
 * Creates the DOM structure for the single slider.
 * <p>
 * As per the {@link goog.ui.Slider} documentation, the Closure slider must be
 * rendered onto a 'goog-slider' class element containing a 'goog-slider-thumb'.
 * The 'goog-slider-background' class is used for formatting. CSS must be
 * provided to properly render the Closure slider.
 * @private
 */
monsoon.ui.Slider.prototype.createDom_ = function() {
  var el = goog.dom.createDom('div', 'monsoon-slider',
      goog.dom.createDom('div', 'monsoon-slider-label'),
      goog.dom.createDom('div', 'goog-slider',
          goog.dom.createDom('div', 'goog-slider-background'),
          goog.dom.createDom('div', 'goog-slider-thumb')),
      goog.dom.createDom('div', 'monsoon-slider-output'));

  this.element_ = el;
};


/**
 * Sets up and initializes the encapsulated basic slider object. Should only be
 * called after createDom.
 * @private
 */
monsoon.ui.Slider.prototype.setupSlider_ = function() {
  this.slider_ = new goog.ui.Slider();

  this.slider_.setMoveToPointEnabled(true);
  this.slider_.setMinimum(this.options_.min);
  this.slider_.setMaximum(this.options_.max);
  this.slider_.setValue(this.options_.start || 0);
  this.slider_.setStep(this.options_.step || 1);

  var el = goog.dom.getElementByClass('goog-slider', this.element_);
  this.slider_.decorate(el);
};


/**
 * Sets up the bindings for the single monsoon slider.
 * @private
 */
monsoon.ui.Slider.prototype.setBindings_ = function() {
  this.slider_.addEventListener(
      goog.ui.Component.EventType.CHANGE,
      goog.bind(this.updateDisplay, this));
};


/**
 * Updates the monsoon slider label, value, and units information. Should only
 * be called after createDom and setupSlider.
 */
monsoon.ui.Slider.prototype.updateDisplay = function() {
  var label = goog.dom.getElementByClass(
      'monsoon-slider-label', this.element_);
  goog.dom.setTextContent(label, this.options_.label);

  var value = goog.dom.getElementByClass(
      'monsoon-slider-output', this.element_);
  goog.dom.setTextContent(
      value, this.slider_.getValue() + ' ' + this.options_.units);
};


/**
 * Renders the monsoon slider onto the page. The slider only needs to be
 * rendered once.
 * @param {string} id The string id for the html element.
 */
monsoon.ui.Slider.prototype.renderById = function(id) {
  var e = goog.dom.getElement(id);
  this.renderByElement(e);
};


/**
 * Renders the monsoon slider onto the page. The slider only needs to be
 * rendered once.
 * @param {Element} el The DOM element to render onto.
 */
monsoon.ui.Slider.prototype.renderByElement = function(el) {
  goog.dom.appendChild(el, this.element_);
};


/**
 * TODO: Finish the slider stack.
 * A stack of three monsoon sliders for baseline, scenario, and average
 * measurements. This class is still unfinished. Stacking them on top of each
 * other should be an issue of CSS, as well as finishing the positioning for
 * the labels for the individual sliders.
 * @constructor
 */
monsoon.ui.SliderStack = function() {

  /**
   * DOM element for this monsoon slider.
   * @type {Element}
   * @private
   */
  this.element_ = null;

  /**
   * Baseline slider for this slider stack.
   * @type {goog.ui.Slider}
   * @private
   */
  this.baseline_ = null;

  /**
   * Scenario slider for this slider stack.
   * @type {goog.ui.Slider}
   * @private
   */
  this.scenario_ = null;

  /**
   * Average slider for this slider stack.
   * @type {goog.ui.Slider}
   * @private
   */
  this.average_ = null;

  // Run initialization functions. HTML is not rendered.
  this.initialize();
};


/**
 * TODO: Add other methods to the initialization to finish stack setup.
 * Initializes the slider stack without rendering.
 */
monsoon.ui.SliderStack.prototype.initialize = function() {
  this.setupSliders_();
  this.setBindings_();
};


/**
 * Sets up the individual sliders for the stack. Creates the DOM structure for
 * the stack and the sliders.
 * @private
 */
monsoon.ui.SliderStack.prototype.setupSliders_ = function() {
  this.element_ = goog.dom.createDom('div', 'monsoon-sliderstack');

  var b = goog.dom.createDom('div', 'sliderstack-baseline');
  var s = goog.dom.createDom('div', 'sliderstack-scenario');
  var a = goog.dom.createDom('div', 'sliderstack-average');

  var options = this.getOptions();

  this.baseline_ = new monsoon.ui.Slider(options);
  this.scenario_ = new monsoon.ui.Slider(options);
  this.average_ = new monsoon.ui.Slider(options);

  this.baseline_.renderByElement(b);
  this.scenario_.renderByElement(s);
  this.average_.renderByElement(a);

  goog.dom.appendChild(this.element_, b);
  goog.dom.appendChild(this.element_, s);
  goog.dom.appendChild(this.element_, a);
};


/**
 * TODO: Set listeners to change sliders in the stack.
 * Sets the bindings for the entire slider stack. Should be called only once
 * after setupSlider_.
 * @private
 */
monsoon.ui.SliderStack.prototype.setBindings_ = function() {};


/**
 * Renders the monsoon slider stack onto the page. The slider stack only needs
 * to be rendered once.
 * @param {string} id The string id for the html element.
 */
monsoon.ui.SliderStack.prototype.renderById = function(id) {
  var e = goog.dom.getElement(id);
  this.renderByElement(e);
};


/**
 * Renders the monsoon slider stack onto the page. The slider stack only needs
 * to be rendered once.
 * @param {Element} el The DOM element to render onto.
 */
monsoon.ui.SliderStack.prototype.renderByElement = function(el) {
  goog.dom.appendChild(el, this.element_);
};


/**
 * Generates {monsoon.ui.SliderOptions} for each of the sliders.
 * TODO: Currently a placeholder for options generation. Add parameters
 * and changes so that we get the correct options for our 3 main sliders.
 * @return {monsoon.ui.SliderOptions} A set of slider options.
 */
monsoon.ui.SliderStack.prototype.getOptions = function() {
  var options = new monsoon.ui.SliderOptions();
  options.min = -100;
  options.max = 100;
  options.label = 'Measurements';
  options.units = 'units';
  options.step = 5;
  options.start = 10;

  return options;
};
