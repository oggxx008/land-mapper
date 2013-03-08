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

"""Saving and retrieving of serialized scenarios."""

__author__ = 'Michal Cierniak'

import datetime
import hashlib
import logging

from django.utils import simplejson as json
from google.appengine.api import users
from google.appengine.ext import db
from google.appengine.ext import webapp


CURRENT_SCHEMA_VERSION = 20110919


def PackageForReply(payload, status):
  """Wrap in a dictionary and convert to JSON."""
  response = {'payload': payload, 'status': status}
  return json.dumps(response)


class MonsoonScenario(db.Model):
  """Models an scenario explored by a user."""
  author = db.UserProperty()
  scenario_id = db.StringProperty(multiline=False)
  scenario_params = db.TextProperty()
  creation_date = db.DateTimeProperty(auto_now_add=True)
  schema_version = db.IntegerProperty()


def RetrieveScenarioMetadata(scenario_id):
  """Retrieves metadata for a specific scenario."""
  query_pattern = "SELECT * FROM MonsoonScenario WHERE scenario_id = '%s'"
  query = query_pattern % scenario_id
  logging.info('Query: %s', query)
  scenario_list = db.GqlQuery(query).fetch(1)
  logging.info('Scenarios: %s', str(scenario_list))
  logging.info('scenario_list len: %d', len(scenario_list))
  if scenario_list:
    scenario = scenario_list[0]
    scenario_params_json = scenario.scenario_params
    logging.info('Params (JSON): %s', scenario_params_json)
    result = {
        'scenario_params_json': scenario_params_json
    }
  else:
    result = None
  logging.info('RetrieveScenarioMetadata result: %s', str(result))
  return result


class SaveScenario(webapp.RequestHandler):
  """Stores a scenario in the datastore after validating it."""

  def get(self):
    logging.info('SubmitScenario.get')
    self.response.out.write('Not supported')

  def post(self):
    logging.info('SubmitScenario.post')
    # We create new ids as SHA1 hex digests of the current timestamp.
    # This makes collisions unlikely but if they happen, we return an error
    # which is then shown to the user and the user can attempt to save again.
    h = hashlib.sha1()
    h.update(str(datetime.datetime.now()))
    scenario_id = h.hexdigest()[:16]  # Long enough to make collisions unlikely
    logging.info('scenario_id="%s"', scenario_id)
    scenario_metadata = RetrieveScenarioMetadata(scenario_id)
    logging.info('scenario metadata: "%s"', str(scenario_metadata))
    if scenario_metadata:
      response = {'message': 'Scenario id already in use: "%s"' % scenario_id}
      logging.info(str(response))
      self.response.out.write('%s\n' % PackageForReply(response, 'Error'))
    else:
      scenario_params = self.request.get('scenario_params')
      logging.info('scenario_params=%s', scenario_params)
      scenario = MonsoonScenario(author=users.get_current_user(),
                                 scenario_id=scenario_id,
                                 scenario_params=scenario_params,
                                 schema_version=CURRENT_SCHEMA_VERSION)
      scenario.put()
      # We do not check that  the operation scucceeded. User will have to try
      # again in case of failures.

      response = {'scenario_id': scenario_id}
      logging.info(str(response))
      self.response.out.write('%s\n' % PackageForReply(response, 'OK'))


class LoadScenario(webapp.RequestHandler):
  """Class for accessing app metadata. It's used by our JS code."""

  def PrintScenarioMetadata(self, scenario_id):
    """Print the scenario metadata as JSON."""
    scenario_metadata = RetrieveScenarioMetadata(scenario_id)
    logging.info('Scenario metadata: "%s"', str(scenario_metadata))
    if scenario_metadata:
      self.response.out.write('%s\n' % PackageForReply(scenario_metadata, 'OK'))
    else:
      self.response.out.write('%s\n' % PackageForReply({}, 'OK'))

  def get(self):
    """Handle a GET request. A parameter scenario_id is used if present."""
    self.response.headers['Content-Type'] = 'text/plain'
    scenario_id = self.request.get('scenario_id')
    if scenario_id:
      self.PrintScenarioMetadata(scenario_id)
    else:
      logging.info('Parameter scenario_id not present')

  def post(self):
    """Handle a POST request. A parameter scenario_id is used if present."""
    self.response.headers['Content-Type'] = 'text/plain'
    scenario_id = self.request.get('scenario_id')
    if scenario_id:
      self.PrintScenarioMetadata(scenario_id)
    else:
      logging.info('Parameter scenario_id not present')
