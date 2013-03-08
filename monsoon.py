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

__author__ = 'Michal Cierniak'

import cgi
import os
import sys

from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app

# Add apipythonclient/ directory to our system import search path.
# To install, follow instructions to "get a local copy..." at
# http://code.google.com/p/google-api-python-client/source/checkout
sys.path.append(os.path.join(os.path.dirname(__file__), 'apipythonclient'))

import monsoon_db
import monsoon_explorer
import monsoon_gli
import monsoon_save


class MainPage(webapp.RequestHandler):
  def get(self):
    template_values = {}
    path = os.path.join(os.path.dirname(__file__), 'index.html')
    self.response.out.write(template.render(path, template_values))


mappings = [
    ('/', MainPage),
    ('/gli', monsoon_gli.ShowGli),
    ('/explore', monsoon_explorer.ShowExplorer),
    ('/db', monsoon_db.AccessData),
    ('/save', monsoon_save.SaveScenario),
    ('/load', monsoon_save.LoadScenario),
    ]


def main():
  run_wsgi_app(webapp.WSGIApplication(mappings, debug=True))

if __name__ == '__main__':
  main()
