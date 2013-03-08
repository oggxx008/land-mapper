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

"""Map-related utilities for Monsoon."""

__author__ = 'Michal Cierniak'

import logging


def get_kml_for_cell(latitude, longitude, lat_delta, lon_delta):
  """Generates KML for a rectangle."""
  kml = '<Polygon><outerBoundaryIs><LinearRing><coordinates>'
  kml += ' %f,%f' % (longitude, latitude)
  kml += ' %f,%f' % (longitude, latitude + lat_delta)
  kml += ' %f,%f' % (longitude + lon_delta, latitude + lat_delta)
  kml += ' %f,%f' % (longitude + lon_delta, latitude)
  kml += ' %f,%f' % (longitude, latitude)
  kml += ' </coordinates></LinearRing></outerBoundaryIs></Polygon>\n'
  return kml


def get_kml_for_grid_from_cell_list(cells):
  """Generates KML for a list of KML polygons."""
  kml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n'
  kml += '<Placemark><name>The Cell</name>'
  kml += ''.join(cells)
  kml += '\n</Placemark>\n'
  kml += '</kml>'
  return kml


def get_kml_for_grid(ft_result, lat_delta, lon_delta):
  """Generates KML for a grid returned from FT."""
  cells = []
  if ft_result:
    ft_text = ft_result.splitlines()
    del ft_text[0]
    for line in ft_text:
      fields = line.split(',')
      lat = float(fields[0])
      lon = float(fields[1])
      cell_kml = get_kml_for_cell(lat, lon, lat_delta, lon_delta)
      cells.append(cell_kml)
      logging.info('Cell KML: ' + cell_kml)
  kml = get_kml_for_grid_from_cell_list(cells)
  logging.info('Combined KML: ' + kml)
  return kml
