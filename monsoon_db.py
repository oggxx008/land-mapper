#!/usr/bin/python2.4
#
# Copyright 2011 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Library to access databases used by Monsoon."""

__author__ = 'Michal Cierniak'

from datetime import datetime
from hashlib import sha224
import logging
import urllib
from urllib2 import HTTPError
from urllib2 import Request
from urllib2 import URLError
from urllib2 import urlopen
from django.utils import simplejson as json
from google.appengine.api import memcache
from google.appengine.api.urlfetch import DownloadError
from google.appengine.ext import webapp
import monsoon_bq
import monsoon_schemas
import re

RESPONSE_PREFIX_LENGTH_TO_LOG = 200
SECONDS_IN_A_DAY = 24 * 60 * 60
MEMCACHE_TIMEOUT_SECONDS = SECONDS_IN_A_DAY
LATENCIES_KEY = 'recent_latencies'
MEMCACHE_TIMEOUT_SECONDS_STATS = 3600
MAX_LATENCIES_LENGTH = 100
MAX_HASH_LENGTH = 8

# Cache the BigQuery client so we don't need to repeat authentication
_bigquery_client = None

# Pattern that matches only 'name="literal"'
_cond_pattern = re.compile('\w*\="\w*"')

def sanitize_map_bounds(map_bounds):
  """Extract lat/long pairs from a query string and convert to float."""
  # By default assume that we're in the Bay Area.
  result = [36, -123, 38, -121]
  if map_bounds:
    result_temp = map_bounds.split(',')
    if len(result_temp) == 4:
      result = [float(result_temp[0]), float(result_temp[1]),
                float(result_temp[2]), float(result_temp[3])]
  return result


def is_simple_column_filter(condition):
  """Checks if the condition expression is a simple column/value filter.

  Args:
    condition: a string, possibly containing a condition filtering to
        a single column's value, e.g. 'column="value"'.
  Returns:
    boolean that tells wheather the condition is a simple column/value filter.
  """
  logging.info('Checking condition %s', condition)
  return _cond_pattern.match(condition)


def __build_query(table_info, table_name, field_name, bounds, condition, limit):
  """Builds a SQL query for a rectangle defined be SW and NE corner."""
  logging.info('build_query: %s' % bounds)
  [lat_name, lon_name] = get_lat_lon_field_names(table_info)
  logging.info('condition: %s' % condition)
  if bounds:
    # The condition below is not correct for edge cases.
    logging.info('bounds: %s' % bounds)
    [sw_lat, sw_lon, ne_lat, ne_lon] = bounds
    logging.info('sw_lat: %s' % sw_lat)
    cond = '%s > %f AND %s < %f AND %s > %f AND %s < %f'
    cond %= (lat_name, sw_lat, lat_name, ne_lat, lon_name, sw_lon, lon_name,
             ne_lon)

    fields = '%s,%s,%s' % (lat_name, lon_name, field_name)

  else:
    cond = condition
    fields = field_name

  query = 'SELECT %s FROM %s WHERE %s LIMIT %d'
  query %= (fields, table_name, cond, limit)
  logging.info('query: ' + query)
  return fields, query


def get_bq_client():
  """Gets the current BigQuery client, creating one if needed."""
  # TODO: make a class to contain this state
  global _bigquery_client
  if _bigquery_client is None:
    logging.info('Creating a new bq v2 client')
    _bigquery_client = monsoon_bq.BigQueryClient()
  else:
    logging.info('Reusing an existing bq v2 client')
  return _bigquery_client


def get_data_from_bq(table_info, field_name, bounds, condition, limit):
  """Retrieve data from BigQuery and return as a list."""
  # Create BigQuery client
  table_id = table_info['id']
  bqclient = get_bq_client()
  table_name = '%s' % table_id
  fields, query = __build_query(
      table_info, table_name, field_name, bounds, condition, limit)
  return run_bq_query_cached(bqclient, query, fields)


def get_ft_request_url(table_info, bounds, condition, table,
                       field_name, limit):
  base_url = 'http://www.google.com/fusiontables/api/query?sql='

  table_name = table
  unused_fields, query = __build_query(
      table_info, table_name, field_name, bounds, condition, limit)

  encoded_url = base_url + urllib.quote(query)
  return encoded_url


def retrieve_http_request_from_memcache(encoded_url):
  """Retrieves a request from memcached."""
  logging.info('Looking in memcache for: ' + encoded_url)
  result = memcache.get(encoded_url)
  if result:
    logging.info('Found in memcache (%d of %d characters): %s',
                 RESPONSE_PREFIX_LENGTH_TO_LOG, len(result),
                 result[:RESPONSE_PREFIX_LENGTH_TO_LOG])
  else:
    logging.info('Not found in memcache')
  return result


def set_http_request_in_memcache(encoded_url, result):
  """Stores the request in memcached."""
  logging.info('Saving in memcache for %d seconds result of request %s',
               MEMCACHE_TIMEOUT_SECONDS, encoded_url)
  logging.info('Result to be saved (%d of %d characters): %s',
               RESPONSE_PREFIX_LENGTH_TO_LOG, len(result),
               result[:RESPONSE_PREFIX_LENGTH_TO_LOG])
  memcache.set(encoded_url, result, MEMCACHE_TIMEOUT_SECONDS)


def make_http_request(encoded_url):
  """Makes an HTTP request and handles basic errors."""
  result = None
  status_text = ''
  req = Request(encoded_url)
  try:
    response = urlopen(req)
  except HTTPError, e:
    status_text = 'HTTPError: %i' % e.code
  except URLError, e:
    status_text = 'URLError: %s', e.reason
  except DownloadError, e:
    status_text = 'DownloadError (most likely a timeout)'
  else:
    result = response.read()
  if status_text:
    logging.info('Error in HTTP request, status_text: ' + status_text)
  return [result, status_text]


def handle_memcache_stats(delta, hit, kind, key):
  """Handles both built-in memcache stats and our own latency stats."""
  stats = memcache.get_stats()
  logging.info('Memcache stats: %s', str(stats))

  # We encode recent request latencies as a JSON-encoded list of stats for
  # recent requests.
  delta_millis = (delta.seconds * 1000) + (delta.microseconds / 1000)
  logging.info('Delta millis: %d', delta_millis)
  result = memcache.get(LATENCIES_KEY)
  result_list = []
  if result:
    result_list = json.loads(result)
  entry = {'hit': hit, 'latency': delta_millis, 'kind': kind}
  if key:
    # A short hash is good enough for our purposes.
    entry['hash'] = sha224(key).hexdigest()[:MAX_HASH_LENGTH]
    entry['key'] = key
  result_list.append(entry)
  if len(result_list) > MAX_LATENCIES_LENGTH:
    result_list.pop(0)  # Remove the first element to keep the list bounded.
  result = json.dumps(result_list)
  memcache.set(LATENCIES_KEY, result, MEMCACHE_TIMEOUT_SECONDS_STATS)


def make_http_request_cached(encoded_url):
  """If needed makes the request and stores it in the cache."""
  # TODO: Refactor this and run_bq_query_cached to reuse code.
  time_start = datetime.utcnow()
  result = retrieve_http_request_from_memcache(encoded_url)
  if result:
    status_text = ''
  else:
    [result, status_text] = make_http_request(encoded_url)
    if not status_text:
      # Only save in memcache if there was no error.
      set_http_request_in_memcache(encoded_url, result)

  time_end = datetime.utcnow()
  delta = time_end - time_start

  handle_memcache_stats(delta, not status_text, 'HTTP', encoded_url)

  return [result, status_text]


def run_bq_query_cached(bqclient, query, fields):
  """If needed makes the request and stores it in the cache."""
  time_start = datetime.utcnow()
  result_json = retrieve_http_request_from_memcache(query)
  if result_json:
    result = json.loads(result_json)
  else:
    # TODO: add project, timeout and limit (etc) parameters for bq v2.
    (metadata, result) = bqclient.Query(query)
    result.insert(0, fields.split(','))
    # Ignoring metadata for now
    #logging.info('metadata: ' + metadata)
    set_http_request_in_memcache(query, json.dumps(result))

  time_end = datetime.utcnow()
  delta = time_end - time_start

  handle_memcache_stats(delta, not not result_json, 'BQ', query)

  return result


def get_lat_lon_field_names(table_info):
  """Return names of fields containing latitude and longitude in a table."""
  lat = 'latitude'
  if 'latitude' in table_info:
    lat = table_info['latitude']
  lon = 'longitude'
  if 'longitude' in table_info:
    lon = table_info['longitude']
  return [lat, lon]


def convert_fields_following_schema(table_info, field_name, fields_text):
  """Convert fields into appropriate types."""
  fields = []
  # We assume that there are 3 fields: latitude, longitude, DATA
  # Lat/lon are floats and the type of the DATA field can be found in metadata.
  field_type = table_info['fields'][field_name]['type']
  lat = float(fields_text[0])
  lon = float(fields_text[1])
  field = fields_text[2]  # By default we will return a string
  if field_type == 'float':
    field = float(fields_text[2])
  fields = [lat, lon, field]
  return fields


def get_data_from_ft(table_info, field_name, bounds, condition, limit):
  """Get data from FT and format for JS."""
  table_id = table_info['id']
  ft_url = get_ft_request_url(table_info, bounds, condition,
                              table_id, field_name, limit)
  [ft_result, status_text] = make_http_request_cached(ft_url)
  status = 'OK'
  lines = []
  if ft_result:
    text_lines = ft_result.splitlines()
    lines.append(text_lines[0].split(','))
    del text_lines[0]
    for text_line in text_lines:
      fields = convert_fields_following_schema(table_info, field_name,
                                               text_line.split(','))
      lines.append(fields)
  else:
    status = 'FT request error: "%s"' % status_text
    logging.info(status)
  return [status, lines]


def get_data_from_table(table_info, field_name, bounds, condition, limit):
  """Get data from FT or BigQuery."""
  backend = table_info['backend']['id']
  logging.info('backend: ' + backend)
  status = 'OK'
  if backend == 'FT':
    [status, lines] = get_data_from_ft(table_info, field_name, bounds, condition, limit)
  elif backend == 'BQ':
    try:
      lines = get_data_from_bq(table_info, field_name, bounds, condition, limit)
    except monsoon_bq.BigQueryClientException, e:
      status = 'BQ database error: "%s" when accessing table "%s"'
      status %= (str(e), table_info['id'])
      lines = []
  else:
    logging.info('Unknown data backend: ' + backend)
  return [status, lines]


def package_for_reply(payload, status):
  """Wrap in a dictionary and convert to JSON."""
  response = {'payload': payload, 'status': status}
  return json.dumps(response)


class AccessData(webapp.RequestHandler):
  """Class for accessing Monsoon data. It's used by our JS code."""
  data_sources = monsoon_schemas.init_data_sources()

  def print_all_tables(self):
    """Prints metadata for all tables."""
    # Currently we can never fail because the data is initialized above.
    self.response.out.write('%s\n' % package_for_reply(AccessData.data_sources,
                                                       'OK'))

  def print_stats(self):
    """Prints stats. Currently just latencies for recent requests."""
    result = memcache.get(LATENCIES_KEY)
    if not result:
      result = ''
    self.response.out.write('%s\n' % result)

  def print_table(self, table_id, field_name):
    """Print the content of a table as JSON."""
    limit = self.request.get('limit')
    if not limit:
      limit = '1'
    limit = int(limit)
    table_info = AccessData.data_sources[table_id]
    if table_info:
      map_bounds = self.request.get('mapBounds')
      logging.info('map_bounds: ' + map_bounds)
      if map_bounds:
        map_bounds = sanitize_map_bounds(map_bounds)
      condition = self.request.get('cond')
      # Throw out any conditions that don't meet the simple-column-filter test.
      condition = condition if is_simple_column_filter(condition) else 'TRUE'
      [status, lines] = get_data_from_table(table_info, field_name,
                                            map_bounds, condition,
                                            limit)
      logging.info('status: ' + status)
      self.response.out.write('%s\n' % package_for_reply(lines, status))
    else:
      message = 'Could not load table ' + table_id
      self.response.out.write('%s\n' % package_for_reply({}, message))

  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    table_id = self.request.get('table')
    field_name = self.request.get('field')
    stats = self.request.get('stats')
    if not field_name:
      field_name = self.request.get('fields')
    logging.info('get table: ' + table_id + ', field: ' + field_name)
    if stats:
      self.print_stats()
    elif table_id:
      self.print_table(table_id, field_name)
    else:
      self.print_all_tables()
