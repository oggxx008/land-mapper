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
 * @fileoverview Code to render the Monsoon data explorer web page.
 * @author Michal Cierniak
 */

goog.provide('monsoon.alpha.Explorer');

goog.require('goog.dom');
goog.require('monsoon.maps.Map');
goog.require('monsoon.maps.MapLayer');
goog.require('monsoon.maps.Util');



/**
 * @param {monsoon.maps.DbBridge=} opt_dbBridge Optional object to use for
 *     database requests.
 * @constructor
 * @extends {monsoon.maps.Map}
 */
monsoon.alpha.Explorer = function(opt_dbBridge) {
  monsoon.maps.Map.call(this, monsoon.alpha.Explorer.IMPL_ID_, opt_dbBridge);
};
goog.inherits(monsoon.alpha.Explorer, monsoon.maps.Map);


/**
 * Instance variable holding the monsoon.alpha.Explorer singleton object.
 * @type {monsoon.alpha.Explorer}
 * @private
 */
monsoon.alpha.Explorer.instance_ = null;


/**
 * Returns the monsoon.alpha.Explorer singleton object, or initializes one if a
 * current instance does not exist.
 * @return {monsoon.alpha.Explorer} singleton Explorer object.
 */
monsoon.alpha.Explorer.getInstance = function() {
  if (!monsoon.alpha.Explorer.instance_) {
    monsoon.alpha.Explorer.instance_ = new monsoon.alpha.Explorer();
  }
  return monsoon.alpha.Explorer.instance_;
};


/**
 * Initializes the explorer web page.
 */
monsoon.alpha.Explorer.initialize = function() {
  // TODO: bind display buttons?
  var explorer = monsoon.alpha.Explorer.getInstance();
  explorer.setUpMonsoonMapPage();
};


/**
 * Id of this implementation.
 * @type {string}
 * @private
 * @const
 */
monsoon.alpha.Explorer.IMPL_ID_ = 'Data Explorer';


/** @inheritDoc */
monsoon.alpha.Explorer.prototype.setActiveLayers = function() {
  var queryParams = this.getQueryParams();

  var table = queryParams['table'];
  var field = queryParams['field'];

  var metadata = this.getAllTablesMetadata()[table];
  var fieldInfo = metadata['fields'][field];
  if (!fieldInfo.display) {
    fieldInfo.display = 'hidden';
  }
  this.addMapLayer(
      new monsoon.maps.MapLayer(table, field, fieldInfo.display));
};


/**
 * @inheritDoc
 *
 * Creates the specific sidebar for the Data Explorer.
 */
monsoon.alpha.Explorer.prototype.createSidebar = function() {
  // Create the sidebar while the map is being initialized.
  var sidebar = goog.dom.getElement('sidebar_content');

  // Display active layers.
  var activeLayersElement = goog.dom.createDom(
      'div',
      null,
      goog.dom.createTextNode('Active layers: '));

  var activeLayersList = goog.dom.createDom('ul');

  for (var i = 0, layer; layer = this.getActiveLayers()[i]; i++) {
    var table = this.getAllTablesMetadata()[layer.getTable()];
    var field = table['fields'][layer.getField()];

    var fieldName = field['name'] || layer.field;
    var separator = (i > 0) ? ', ' : '';
    var layerElement = goog.dom.createDom(
        'li',
        null,
        separator + fieldName + ' (' + layer.getDisplay() + ')');

    goog.dom.appendChild(activeLayersList, layerElement);
  }
  goog.dom.appendChild(activeLayersElement, activeLayersList);
  goog.dom.appendChild(activeLayersElement, goog.dom.createDom('hr'));
  goog.dom.appendChild(sidebar, activeLayersElement);

  // Now list all known tables.
  var tablesHeaderElement = goog.dom.createDom(
      'div',
      null,
      goog.dom.createTextNode('All known tables: '));
  goog.dom.appendChild(sidebar, tablesHeaderElement);

  for (tableId in this.getAllTablesMetadata()) {
    var table = this.getAllTablesMetadata()[tableId];
    var tableElement = goog.dom.createDom('div', null, table['name']);

    var fieldsElement = goog.dom.createDom('ul');
    var fields = table['fields'];
    var first = true;
    for (field_name in fields) {
      var field = fields[field_name];
      if (field['display']) {
        if (first) {
          first = false;
        }

        var listElement = goog.dom.createDom('li');
        var link = goog.dom.createDom(
          'a',
          {'href': monsoon.maps.Util.mapUrl(tableId, field_name)});
        var text = field['name'] || field_name;
        var suffix = goog.dom.createTextNode(text);

        goog.dom.appendChild(link, suffix);
        goog.dom.appendChild(listElement, link);
        goog.dom.appendChild(fieldsElement, listElement);
        goog.dom.appendChild(tableElement, fieldsElement);
      }
    }

    // Only display tables with displayable layers
    if (!first) {
      goog.dom.appendChild(sidebar, tableElement);
    }
  }
};


/** @inheritDoc */
monsoon.alpha.Explorer.prototype.createCell = function(cellInfo) {
  var lat = cellInfo.getLat();
  var lng = cellInfo.getLng();
  var latDelta = cellInfo.latDelta;
  var lngDelta = cellInfo.lngDelta;
  var relativeSize = cellInfo.size;

  var cellBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(lat, lng),
      new google.maps.LatLng(
          lat + (latDelta * relativeSize), lng + (lngDelta * relativeSize)));

  // Constructs the rectangle
  var cell = new google.maps.Rectangle({
    bounds: cellBounds,
    strokeColor: '#550000',
    strokeOpacity: 0.8,
    strokeWeight: cellInfo.strokeWeight,
    fillColor: cellInfo.fillColor,
    fillOpacity: 0.35
  });

  // setup info window for the cell
  google.maps.event.addListener(
      cell,
      goog.events.EventType.CLICK,
      goog.bind(this.displayInfoWindow, this, cell));

  return cell;
};


/** @inheritDoc */
monsoon.alpha.Explorer.prototype.updateCell = function(cellInfo) {
  throw Error('Explorer does not update cell values!');
};


/** @inheritDoc */
monsoon.alpha.Explorer.prototype.createPoint = function(pointInfo) {
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
monsoon.alpha.Explorer.prototype.createInfoWindowContent = function(cell) {
  // TODO: Implement specific InfoWindow content
  var tile = cell.tile;

  var infoContent = goog.dom.createDom('div', null,
      goog.dom.createDom('div', null, 'Lat: ' + tile.lat),
      goog.dom.createDom('div', null, 'Lng: ' + tile.lng),
      goog.dom.createDom('div', null, 'Value: ' + tile.value));

  return infoContent;
};


/** @inheritDoc */
monsoon.alpha.Explorer.prototype.createDisplaybar = function() {
  // Not needed for the explorer
};


/** @inheritDoc */
monsoon.alpha.Explorer.prototype.notifyMapChanged = function() {
  // Not needed for the explorer
};


/** @inheritDoc */
monsoon.alpha.Explorer.prototype.dataChanged = function() {
  // Not needed for the explorer
};


/**
 * TODO: helper methods to help with sidebar management.
 * @return {Object} dom object of a block in the sidebar.
 */
monsoon.alpha.Explorer.prototype.sidebarBlock = function() {
  var block = goog.dom.createDom('div', {'id': 'sidebar_block'}, null);
  return block;
};

