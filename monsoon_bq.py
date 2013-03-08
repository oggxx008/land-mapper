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

"""Library to make BigQuery v2 client requests."""

__author__ = 'Donn Denman'

import logging

from apiclient import discovery
from google.appengine.api import memcache
import httplib2
from oauth2client.client import Credentials

# Paste your oauth credentials here
# TODO: Update credential handling by storing them per-user in the AE datastore
# See http://goo.gl/55Qed
_CREDENTIALS = '{"_module": "oauth2client.client", "_class": "OAuth2Credentials", "access_token": "ya29.AHES6ZQbQwuLT9W_t9hJtJqTVnNV1AiK2QDvNMfxornFyXg", "token_uri": "https://accounts.google.com/o/oauth2/token", "invalid": false, "client_id": "977385342095.apps.googleusercontent.com", "client_secret": "wbER7576mc_1YOII0dGk7jEE", "token_expiry": "2011-11-10T21:15:20Z", "refresh_token": "1/g-jchBvHrH1AxO8S1nxMxq2CxXV2NM0rqTGVhpjwr-g", "user_agent": "bq/2.0"}'

# Defaults
_TIMEOUT_MS = 100000
_BIGQUERY_API_VERSION = 'v2'

# Our default project, monsoon is in the google.com domain
_DEFAULT_PROJECT = 'google.com:monsoon'

# Discovery URL
DISCOVERY_URL = (
    'https://www.googleapis.com/discovery/v1/apis/{api}/{apiVersion}/rest')


class BigQueryClientException(Exception):
  pass


class BigQueryClient(object):
  """BigQuery version 2 client, designed to be plug compatible with v1."""

  def __init__(self, api_version=_BIGQUERY_API_VERSION):
    """Creates the BigQuery client connection."""
    self.http = httplib2.Http(cache=memcache)
    self.service = discovery.build('bigquery',
                                   api_version,
                                   http=self.http,
                                   discoveryServiceUrl=DISCOVERY_URL)
    if _CREDENTIALS is None:
      raise BigQueryClientException(
          'Needed Credentials are missing from this source code!')
    credentials = Credentials.new_from_json(_CREDENTIALS)
    logging.info('Authorizing...')
    self.http = credentials.authorize(self.http)

  def Query(self, query, project_id=_DEFAULT_PROJECT, timeout_ms=_TIMEOUT_MS):
    """Issues a query to bigquery v2."""
    query_config = {
        'query': query,
        'timeoutMs': timeout_ms
    }
    logging.info('!Issuing query: %s', query)
    try:
      result_json = (self.service.jobs()
                     .query(projectId=project_id, body=query_config)
                     .execute(self.http))
    except Exception, e:
      # Convert any exception into a BigQueryClientException
      raise BigQueryClientException(e)
    total_rows = result_json['totalRows']
    logging.info('Query result total_rows: %s', total_rows)
    schema = self.Schema(result_json['schema'])
    result_rows = []
    if 'rows' in result_json:
      for row in result_json['rows']:
        result_rows.append(schema.ConvertRow(row))
    logging.info('Returning %d rows.', len(result_rows))
    return ([], result_rows)

  class Schema(object):
    """Does schema-based type conversion of result data."""

    def __init__(self, schema_row):
      """Sets up the schema converter.

      Args:
        schema_row: a dict containing BigQuery schema definitions, ala
            {'fields': [{'type': 'FLOAT', 'name': 'field', 'mode': 'REQUIRED'},
                        {'type': 'INTEGER', 'name': 'climate_bin'}]}
      """
      self.schema = []
      for field in schema_row['fields']:
        self.schema.append(field['type'])

    def ConvertRow(self, row):
      """Converts a rows of data into a tuple with type conversion applied.

      Args:
        row: a row of BigQuery data, ala
            {'f': [{'v': 665.60329999999999}, {'v': '1'}]}
      Returns:
        a tuple with the converted data values for the row.
      """
      i = 0
      data = []
      for entry in row['f']:
        data.append(self.Convert(entry['v'], self.schema[i]))
        i += 1
      return tuple(data)

    def Convert(self, entry, schema_type):
      """Converts an entry based on the schema type given.

      Args:
        entry: the data entry to convert.
        schema_type: appropriate type for the entry.
      Returns:
        the data entry, either as passed in, or converted to the given type.
      """
      if entry is None:
        return None
      if schema_type == u'FLOAT':
        return float(entry)
      elif schema_type == u'INTEGER':
        return int(entry)
      else:
        return entry
