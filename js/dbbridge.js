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
 * @fileoverview Utility to make database requests for monsoon.
 * @author Donn Denman
 */

goog.provide('monsoon.maps.DbBridge');

goog.require('goog.Uri');
goog.require('goog.net.XhrIo');



/**
 * Database request utility for Monsoon, bridging our frontend's model
 * of tables and fields with our backend's model of request uris.
 * @param {Object} opt_sender Optional object to use to send requests.
 *     Defaults to {@link goog.net.XhrIo}.
 * @constructor
 */
monsoon.maps.DbBridge = function(opt_sender) {

  /**
   * The object to use when sending database requests.
   * @type {Object}
   * @private
   */
  this.sender_ = opt_sender || goog.net.XhrIo;

  /**
   * Counter for requests from this instance.
   * @type {number}
   * @private
   */
  this.numDataRequests_ = 0;

  /**
   * Counter for responses from this instance.
   * @type {number}
   * @private
   */
  this.numDataResponses_ = 0;

  /**
   * Counter for http errors from this instance.
   * @type {number}
   * @private
   */
  this.numHttpErrors_ = 0;

  /**
   * Counter for server-side diagnostics from this instance.
   * @type {number}
   * @private
   */
  this.numServerDiagnostics_ = 0;
};


/**
 * Database request path.
 * @type {string}
 * @const
 * @private
 */
monsoon.maps.DbBridge.DB_REQUEST_PATH_ = '/db';

/**
 * Limit of the number of data items to request when requesting layer data.
 * @type {number}
 * @const
 * @private
 */
monsoon.maps.DbBridge.DATA_REQUEST_LIMIT_ = 2000;

/**
 * Parameters used by {@link monsoon.maps.DbBridge.dbRequestUri_} method.
 * @enum {string}
 * @private
 */
monsoon.maps.DbBridge.DbRequestUriParams_ = {
  ID: 'table',
  FIELD: 'field',
  MAP_BOUNDS: 'mapBounds',
  LIMIT: 'limit'
};


/**
 * Creates an URI for a Monsoon data request for a specific
 * table or for metadata for all tables.  The URI will be based on the
 * specifics from the current document location, including domain, port, etc.
 * @param {string} id The id of the table. If empty, return an URI that
 *     requests metadata for all tables.
 * @param {string} field The field to fetch. Only used if id is provided.
 * @param {string} mapBounds Map bounds for data to be fetched. Only used if
 *     id is provided.
 * @param {number=} opt_limit Optional limit of the number of items to return,
 *     or omit the value to get a default limit (imposed for safety reasons).
 * @return {!goog.Uri} The URI for a Monsoon data request.
 * @private
 */
monsoon.maps.DbBridge.prototype.dbRequestUri_ = function(
    id, field, mapBounds, opt_limit) {
  var dbUri = new goog.Uri(document.location);
  return this.dbRequestUriFromBase_(dbUri, id, field, mapBounds, opt_limit);
};


/**
 * Creates an URI for a Monsoon data request for a specific
 * table or for metadata for all tables, based on a supplied base URI.
 * @param {!goog.Uri} baseUri The URI to use as a base for constructing
 *     the db request.  Supplies domain, port, etc, but not path and params.
 * @param {string} id The id of the table. If empty, return an URI that
 *     requests metadata for all tables.
 * @param {string} field The field to fetch. Only used if id is provided.
 * @param {string} mapBounds Map bounds for data to be fetched. Only used if
 *     id is provided.
 * @param {number=} opt_limit Optional limit of the number of items to return,
 *     or omit the parameter to get the  default limit (imposed for
 *     safety reasons).
 * @return {!goog.Uri} The URI for a Monsoon data request.
 * @private
 */
monsoon.maps.DbBridge.prototype.dbRequestUriFromBase_ = function(
    baseUri, id, field, mapBounds, opt_limit) {
  var userInfo = null;
  var dbUri = goog.Uri.create(
      baseUri.getScheme(),
      userInfo,
      baseUri.getDomain(),
      baseUri.getPort(),
      monsoon.maps.DbBridge.DB_REQUEST_PATH_);
  if (id) {
    var safetyLimit = opt_limit || monsoon.maps.DbBridge.DATA_REQUEST_LIMIT_;
    var params = monsoon.maps.DbBridge.DbRequestUriParams_;
    dbUri.setParameterValue(params.LIMIT, safetyLimit);
    dbUri.setParameterValue(params.ID, id);
    if (field) {
      dbUri.setParameterValue(params.FIELD, field);
    }
    if (mapBounds) {
      dbUri.setParameterValue(params.MAP_BOUNDS, mapBounds);
    }
  }
  return dbUri;
};


/**
 * Starts an XHR request to get data for a single layer.
 * @param {!google.maps.LatLngBounds} dataRequestBounds Rectangle to get
 *     data for.
 * @param {!function(Object, monsoon.maps.MapLayer, boolean)} callback Function
 *     to call when data is received.
 * @param {boolean} incremental Whether this an incremental ({@code true})
 *     or initial ({@code false}) request.
 * @param {!monsoon.maps.MapLayer} layer The layer whose data we should request.
 */
monsoon.maps.DbBridge.prototype.getDataForLayer = function(
    dataRequestBounds, callback, incremental, layer) {
  if (dataRequestBounds) {
    var bounds = dataRequestBounds.toUrlValue();
    var uri = this.dbRequestUri_(layer.getTable(), layer.getField(), bounds);
    this.requestInternal_(uri, function(response) {
      callback(response, layer, incremental);
    });
  }
};


/**
 * Starts an XHR request to get all metadata.
 * @param {!function(Object)} callback The callback function to call when
 *     the metadata is received.
 */
monsoon.maps.DbBridge.prototype.requestMetadata = function(callback) {
  var uri = this.dbRequestUri_('', '', '');
  this.requestInternal_(uri, callback);
};


/**
 * Starts an XHR request to get data from the specified uri and call
 * the {@code callback} with the json response.
 * <p>
 * Tracks the number of requests and errors.
 * @param {!goog.Uri} uri The request URI.
 * @param {!function(Object)} callback The callback function to call with the
 *     response data.
 * @private
 */
monsoon.maps.DbBridge.prototype.requestInternal_ = function(uri, callback) {
  this.numDataRequests_++;
  var boundCallback = goog.bind(
      function(e) {
        this.numDataResponses_++;
        var xhr = e.target;
        if (xhr.isSuccess()) {
          var response = xhr.getResponseJson();
          if (response['status'] == 'OK') {
            callback(response);
          } else {
            // TODO: add notification of errors for these cases
            this.numServerDiagnostics_++;
          }
        } else {
          this.numHttpErrors_++;
        }
      },
      this);
  this.sender_.send(uri, boundCallback);
};


/**
 * Requests columns of data, calling the specified callback function with the
 * response.
 * @param {string} table The ID of the table to request data from.
 * @param {Array.<string>} fields A list of fields to request.
 * @param {!function(Object)} callback The function to call to process
 *     the response data.
 * @param {number=} opt_limit Optional limit to the number of items to return.
 */
monsoon.maps.DbBridge.prototype.requestColumnData = function(
    table, fields, callback, opt_limit) {
  var allFields = fields.join(',');
  var limit = opt_limit || monsoon.maps.DbBridge.DATA_REQUEST_LIMIT_;
  var unusedBounds = null;
  var uri = this.dbRequestUri_(table, allFields, unusedBounds, limit);
  this.requestInternal_(uri, callback);
};


/**
 * @return {number} The total number of requests for this instance.
 */
monsoon.maps.DbBridge.prototype.getRequestCount = function() {
  return this.numDataRequests_;
};


/**
 * @return {number} The total number of responses for this instance.
 */
monsoon.maps.DbBridge.prototype.getResponseCount = function() {
  return this.numDataResponses_;
};


/**
 * @return {number} The total number of errors and diagnostics for
 *     this instance.
 */
monsoon.maps.DbBridge.prototype.getErrorCount = function() {
  return this.numHttpErrors_ + this.numServerDiagnostics_;
};


/**
 * @return {number} The number of HTTP errors for this instance.
 */
monsoon.maps.DbBridge.prototype.getHttpErrorCount = function() {
  return this.numHttpErrors_;
};


/**
 * @return {number} The number of server diagnostics returned for this instance.
 */
monsoon.maps.DbBridge.prototype.getServerDiagnosticsCount = function() {
  return this.numServerDiagnostics_;
};


/**
 * Makes a POST XHR back to the server.
 * @param {!Object} params A parameter map for the POST request.
 * @param {string} path Path on the server for the POST request.
 * @param {function(Object)} callback Function to call for successful responses.
 */
monsoon.maps.DbBridge.prototype.postToServer = function(
    params, path, callback) {
  var paramsMap = new goog.structs.Map(params);
  var data = goog.Uri.QueryData.createFromMap(paramsMap);
  var boundXhrHandler = goog.bind(this.postXhrResponseHandler_, this);
  var xhrCallback = function(event) {
    boundXhrHandler(event, callback);
  };
  goog.net.XhrIo.send(path, xhrCallback, 'POST', data);
};


/**
 * Checks the request was successful and if OK, calls the callback function.
 * @param {!goog.net.XhrIo} event Event associated with the request.
 * @param {function(Object)} callback Function to call for successful responses.
 * @private
 */
monsoon.maps.DbBridge.prototype.postXhrResponseHandler_ = function(
    event, callback) {
  var xhr = event.target;
  if (xhr.getStatus() == 200) {
    callback(xhr.getResponseJson());
  } else {
    alert('Server error: ' + xhr.getStatus());
  }
};
