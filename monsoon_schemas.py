#!/usr/bin/python2.4
# -*- coding: utf-8 -*-
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

"""Schemas for tables used by Monsoon."""

__author__ = 'Michal Cierniak'


def init_data_sources():
  """Initializes metadata for data sources."""
  sources = {}

  # Sample Fusion Table dataset
  table = {'id': '588453', 'name': 'Crop area',
           'backend': {'id': 'FT', 'name': 'Fusion Tables'},
           'fields': {'latitude': {'type': 'float'},
                      'longitude': {'type': 'float'},
                      'area': {'name': 'area', 'type': 'float',
                               'min': 0.5, 'max': 1, 'display': 'grid'}},
           'lat_delta': 0.08334, 'lon_delta': 0.08334}
  sources[table['id']] = table

  # See monsoon/schema/crop-maize-all.schema
  table = {'id': 'umn.All_Cropgroups',
           'backend': {'id': 'BQ', 'name': 'BigQuery'},
           'name': 'All Cropgroups',
           'fields': {'latitude': {'type': 'float'},
                      'longitude': {'type': 'float'},
                      'year': {'type': 'integer'},
                      'Cereals_area': {'name': 'Cereals area', 'type': 'float',
                                       'min': 0, 'max': 1, 'display': 'grid'},
                      'Cereals_yield': {'name': 'Cereals yield',
                                        'type': 'float', 'min': 0, 'max': 20,
                                        'display': 'grid'},
                      'Fiber_area': {'name': 'Fiber area', 'type': 'float',
                                     'min': 0, 'max': 1, 'display': 'grid'},
                      'Fiber_yield': {'name': 'Fiber yield', 'type': 'float',
                                      'min': 0, 'max': 20, 'display': 'grid'},
                      'Forage_area': {'name': 'Forage area', 'type': 'float',
                                      'min': 0, 'max': 1, 'display': 'grid'},
                      'Forage_yield': {'name': 'Forage yield', 'type': 'float',
                                       'min': 0, 'max': 20, 'display': 'grid'},
                      'Fruit_area': {'name': 'Fruit area', 'type': 'float',
                                     'min': 0, 'max': 1, 'display': 'grid'},
                      'Fruit_yield': {'name': 'Fruit yield', 'type': 'float',
                                      'min': 0, 'max': 20, 'display': 'grid'},
                      'Oilcrops_area': {'name': 'Oil crops area',
                                        'type': 'float', 'min': 0, 'max': 1,
                                        'display': 'grid'},
                      'Oilcrops_yield': {'name': 'Oil crops yield',
                                         'type': 'float', 'min': 0, 'max': 20,
                                         'display': 'grid'},
                      'OtherCrops_area': {'name': 'Other crops area',
                                          'type': 'float', 'min': 0, 'max': 1,
                                          'display': 'grid'},
                      'OtherCrops_yield': {'name': 'Other crops yield',
                                           'type': 'float', 'min': 0, 'max': 20,
                                           'display': 'grid'},
                      'Roots_and_Tubers_area': {'name': 'Roots & tubers area',
                                                'type': 'float', 'min': 0,
                                                'max': 1, 'display': 'grid'},
                      'Roots_and_Tubers_yield': {'name': 'Roots & tubers yield',
                                                 'type': 'float', 'min': 0,
                                                 'max': 20, 'display': 'grid'},
                      'SugarCrops_area': {'name': 'Sugar crops area',
                                          'type': 'float', 'min': 0, 'max': 1,
                                          'display': 'grid'},
                      'SugarCrops_yield': {'name': 'Sugar crops yield',
                                           'type': 'float', 'min': 0, 'max': 20,
                                           'display': 'grid'},
                      'Treenuts_area': {'name': 'Tree nuts area',
                                        'type': 'float', 'min': 0, 'max': 1,
                                        'display': 'grid'},
                      'Treenuts_yield': {'name': 'Tree nuts yield',
                                         'type': 'float', 'min': 0, 'max': 20,
                                         'display': 'grid'},
                      'Vegetables_and_Melons_area': {'name': ('Vegetables & '
                                                     'melons area'),
                                                     'type': 'float',
                                                     'min': 0, 'max': 1,
                                                     'display': 'grid'},
                      'Vegetables_and_Melons_yield': {'name': ('Vegetables & '
                                                      'melons yield'),
                                                      'type': 'float', 'min': 0,
                                                      'max': 20,
                                                      'display': 'grid'}},
           'lat_delta': 0.08334, 'lon_delta': 0.08334,
           'metadata': {'description': {'long': 'University of Minnesota, '
                                        'Global Landscapes Initiative - '
                                        'All Crop Groups.',
                                        'short': 'GLI All Crops'},
                        'author': ['James S. Gerber'],
                        'publication_year': 2011,
                        'web_site': 'http://malthus.cfans.umn.edu/Google/',
                        'institution': 'University of Minnesota',
                        'institution_web_site': 'http://www.umn.edu/',
                        'institution_logo': 'UMN.gif'}}
  sources[table['id']] = table

  # See monsoon/schema/crops-2005.schema
  table = {'id': 'umn.Crops_2005',
           'backend': {'id': 'BQ', 'name': 'BigQuery'},
           'name': 'Crops 2005',
           'fields': {'latitude': {'type': 'float'},
                      'longitude': {'type': 'float'},
                      'year': {'type': 'integer'},
                      'maize_area': {'name': 'Maize area', 'type': 'float',
                                     'min': 0, 'max': 1, 'display': 'grid'},
                      'maize_yield': {'name': 'Maize yield', 'type': 'float',
                                      'min': 0, 'max': 22.5, 'display': 'grid'},
                      'rice_area': {'name': 'Rice area', 'type': 'float',
                                    'min': 0, 'max': 1, 'display': 'grid'},
                      'rice_yield': {'name': 'Rice yield', 'type': 'float',
                                     'min': 0, 'max': 15.2, 'display': 'grid'},
                      'wheat_area': {'name': 'Wheat area', 'type': 'float',
                                     'min': 0, 'max': 1, 'display': 'grid'},
                      'wheat_yield': {'name': 'Wheat yield', 'type': 'float',
                                      'min': 0, 'max': 402, 'display': 'grid'}},
           'lat_delta': 0.08334, 'lon_delta': 0.08334,
           'metadata': {'description': {'long': 'University of Minnesota, '
                                        'Global Landscapes Initiative - '
                                        'Selected Crops from 2005.',
                                        'short': 'Crops 2005'},
                        'author': ['James S. Gerber'],
                        'publication_year': 2011,
                        'web_site': 'http://malthus.cfans.umn.edu/Google/',
                        'institution': 'University of Minnesota',
                        'institution_web_site': 'http://www.umn.edu/',
                        'institution_logo': 'UMN.gif'}}
  sources[table['id']] = table

  # See monsoon/schema/crops-q.schema
  table = {'id': 'umn.Crops_Q',
           'backend': {'id': 'BQ', 'name': 'BigQuery'},
           'name': 'Crops Q',
           'fields': {'latitude': {'type': 'float'},
                      'longitude': {'type': 'float'},
                      'year': {'type': 'integer'},
                      'quince_area': {'name': 'Quince area', 'type': 'float',
                                      'min': 0, 'max': 1, 'display': 'grid'},
                      'quince_yield': {'name': 'Quince yield', 'type': 'float',
                                       'min': 0, 'max': 20.0,
                                       'display': 'grid'},
                      'quince_area_source': {'name': 'Source of quince area',
                                             'type': 'float', 'min': 0,
                                             'max': 1, 'display': 'grid'},
                      'quince_yield_source': {'name': 'Source of quince yield',
                                              'type': 'float', 'min': 0,
                                              'max': 1, 'display': 'grid'},
                      'quinoa_area': {'name': 'Quinoa area', 'type': 'float',
                                      'min': 0, 'max': 1, 'display': 'grid'},
                      'quinoa_yield': {'name': 'Quinoa yield', 'type': 'float',
                                       'min': 0, 'max': 0.97,
                                       'display': 'grid'},
                      'quinoa_area_source': {'name': 'Source of quinoa area',
                                             'type': 'float', 'min': 0,
                                             'max': 1, 'display': 'grid'},
                      'quinoa_yield_source': {'name': 'Source of quinoa yield',
                                              'type': 'float', 'min': 0,
                                              'max': 1, 'display': 'grid'}},
           'lat_delta': 0.08334, 'lon_delta': 0.08334,
           'metadata': {'description': {'long': 'University of Minnesota, '
                                        'Global Landscapes Initiative - '
                                        'Crops starting with the letter Q.',
                                        'short': 'Crops Q'},
                        'author': ['James S. Gerber'],
                        'publication_year': 2011,
                        'web_site': 'http://malthus.cfans.umn.edu/Google/',
                        'institution': 'University of Minnesota',
                        'institution_web_site': 'http://www.umn.edu/',
                        'institution_logo': 'UMN.gif'}}
  sources[table['id']] = table

  table = {'id': 'umn.All_Maize',
           'backend': {'id': 'BQ', 'name': 'BigQuery'},
           'name': 'All maize-related data',
           'fields': {'latitude': {'type': 'float'},
                      'longitude': {'type': 'float'},
                      'year': {'type': 'integer'},
                      'maize_area': {'name': 'area', 'type': 'float',
                                     'min': 0, 'max': 1, 'display': 'grid'},
                      'maize_yield': {'name': 'yield', 'type': 'float',
                                      'min': 0, 'max': 14, 'display': 'grid'},
                      'maize_climate_bin': {'name': 'climate_bin',
                                            'type': 'float', 'min': 0,
                                            'max': 100, 'display': 'grid'},
                      'maize_N': {'name': 'fertilizer N', 'type': 'float',
                                  'min': 0, 'max': 400, 'display': 'grid'},
                      'maize_P2O5': {'name': 'fertilizer P', 'type': 'float',
                                     'min': 0, 'max': 400, 'display': 'grid'},
                      'maize_K2O': {'name': 'fertilizer K', 'type': 'float',
                                     'min': 0, 'max': 400, 'display': 'grid'}},
           'lat_delta': 0.08334, 'lon_delta': 0.08334,
           'metadata': {'description': {'long': 'University of Minnesota, '
                                        'Global Landscapes Initiative - All '
                                        'Maize.',
                                        'short': 'GLI All Maize'},
                        'author': ['James S. Gerber'],
                        'publication_year': 2011,
                        'web_site': 'http://malthus.cfans.umn.edu/Google/',
                        'institution': 'University of Minnesota',
                        'institution_web_site': 'http://www.umn.edu/',
                        'institution_logo': 'UMN.gif'}}
  sources[table['id']] = table

  table = {'id': 'umn.GDD_v3',
           'backend': {'id': 'BQ', 'name': 'BigQuery'},
           'name': 'WorldClim global degree days',
           'latitude': 'latitude', 'longitude': 'longitude',
           'fields': {'latitude': {'type': 'float'},
                      'longitude': {'type': 'float'},
                      'GDD0': {'name': 'GDD0 [C/y]',
                               'type': 'float',
                               'min': 0, 'max': 12000,
                               'display': 'grid'},
                      'GDD1': {'name': 'GDD1 [C/y]',
                               'type': 'float',
                               'min': 0, 'max': 12000,
                               'display': 'grid'},
                      'GDD2': {'name': 'GDD2 [C/y]',
                               'type': 'float',
                               'min': 0, 'max': 12000,
                               'display': 'grid'},
                      'GDD3': {'name': 'GDD3 [C/y]',
                               'type': 'float',
                               'min': 0, 'max': 12000,
                               'display': 'grid'},
                      'GDD4': {'name': 'GDD4 [C/y]',
                               'type': 'float',
                               'min': 0, 'max': 12000,
                               'display': 'grid'},
                      'GDD5': {'name': 'GDD5 [C/y]',
                               'type': 'float',
                               'min': 0, 'max': 12000,
                               'display': 'grid'},
                      'GDD6': {'name': 'GDD6 [C/y]',
                               'type': 'float',
                               'min': 0, 'max': 12000,
                               'display': 'grid'},
                      'GDD7': {'name': 'GDD7 [C/y]',
                               'type': 'float',
                               'min': 0, 'max': 12000,
                               'display': 'grid'},
                      'GDD8': {'name': 'GDD8 [C/y]',
                               'type': 'float',
                               'min': 0, 'max': 12000,
                               'display': 'grid'},
                      'GDD9': {'name': 'GDD9 [C/y]',
                               'type': 'float',
                               'min': 0, 'max': 12000,
                               'display': 'grid'},
                      'GDD10': {'name': 'GDD10 [C/y]',
                                'type': 'float',
                                'min': 0, 'max': 12000,
                                'display': 'grid'},
                      'GDD11': {'name': 'GDD11 [C/y]',
                                'type': 'float',
                                'min': 0, 'max': 12000,
                                'display': 'grid'},
                      'GDD12': {'name': 'GDD12 [C/y]',
                                'type': 'float',
                                'min': 0, 'max': 12000,
                                'display': 'grid'}},
           'lat_delta': 0.08334, 'lon_delta': 0.08334,
           'metadata': {'description': {'long': 'University of Minnesota, '
                                        'Global Landscapes Initiative - '
                                        'Global Degree Days.',
                                        'short': 'GLI GDD'},
                        'author': ['James S. Gerber'],
                        'publication_year': 2011,
                        'web_site': 'http://malthus.cfans.umn.edu/Google/',
                        'institution': 'University of Minnesota',
                        'institution_web_site': 'http://www.umn.edu/',
                        'institution_logo': 'UMN.gif'}}
  sources[table['id']] = table

  table = {'id': 'umn.Crop_Details',
           'backend': {'id': 'BQ', 'name': 'BigQuery'},
           'name': 'Attributes of various crops',
           'fields': {'gdd_base_temp_c': {'name': 'Base temp for growth [C]',
                                          'type': 'integer',
                                          'min': 0, 'max': 10},
                      'crop_name': {'name': 'Crop name', 'type': 'string'}},
           'metadata': {'description': {'long': 'University of Minnesota, '
                                        'Global Landscapes Initiative - '
                                        'Base Temperature for Growth.',
                                        'short': 'GLI Base Temp'},
                        'author': ['James S. Gerber'],
                        'publication_year': 2011,
                        'web_site': 'http://malthus.cfans.umn.edu/Google/',
                        'institution': 'University of Minnesota',
                        'institution_web_site': 'http://www.umn.edu/',
                        'institution_logo': 'UMN.gif'}}
  sources[table['id']] = table

  table = {'id': 'umn.Crop_Climate_Defs',
           'backend': {'id': 'BQ', 'name': 'BigQuery'},
           'name': 'Definitions of climate bins for all crops',
           'fields': {'bin_number': {'name': 'Bin number',
                                     'type': 'integer',
                                     'min': 1, 'max': 100},
                      'gdd_min_temp_c': {'name': 'GDD min temp [C/y]',
                                         'type': 'float',
                                         'min': 0, 'max': 12000},
                      'gdd_max_temp_c': {'name': 'GDD max temp [C/y]',
                                         'type': 'float',
                                         'min': 0, 'max': 12000},
                      'precip_min_mm': {'name': 'Precipitation min [mm/y]',
                                        'type': 'float',
                                        'min': 0, 'max': 10000},
                      'precip_max_mm': {'name': 'Precipitation max [mm/y]',
                                        'type': 'float',
                                        'min': 0, 'max': 10000},
                      'potential_yield_tons_per_ha': {
                          'name': 'Potential yield [tons/ha]',
                          'type': 'float',
                          'min': 0, 'max': 2600},
                      'crop_name': {'name': 'Crop',
                                    'type': 'string'}},
           'metadata': {'description': {'long': 'University of Minnesota, '
                                        'Global Landscapes Initiative - '
                                        'Climate Bin Definitions.',
                                        'short': 'GLI Climate Bins'},
                        'author': ['James S. Gerber'],
                        'publication_year': 2011,
                        'web_site': 'http://malthus.cfans.umn.edu/Google/',
                        'institution': 'University of Minnesota',
                        'institution_web_site': 'http://www.umn.edu/',
                        'institution_logo': 'UMN.gif'}}
  sources[table['id']] = table

  table = {'id': 'umn.yield_model_maize',
           'backend': {'id': 'BQ', 'name': 'BigQuery'},
           'name': 'Yield model for maize',
           'fields': {'climate_bin': {'name': 'Climate bin',
                                      'type': 'integer',
                                      'min': 1, 'max': 101},
                      'gdd_min_temp_c': {'name': 'GDD min temp [C/y]',
                                         'type': 'float',
                                         'min': 0, 'max': 12000},
                      'gdd_max_temp_c': {'name': 'GDD max temp [C/y]',
                                         'type': 'float',
                                         'min': 0, 'max': 12000},
                      'precip_min_mm': {'name': 'Precipitation min [mm/y]',
                                        'type': 'float',
                                        'min': 0, 'max': 10000},
                      'precip_max_mm': {'name': 'Precipitation max [mm/y]',
                                        'type': 'float',
                                        'min': 0, 'max': 10000},
                      'potential_yield_tons_per_ha': {
                          'name': 'Potential yield [tons/ha]',
                          'type': 'float',
                          'min': 0, 'max': 14},
                      'minimum_yield_tons_per_ha': {
                          'name': 'Minimum yield [tons/ha]',
                          'type': 'float',
                          'min': 0, 'max': 4}},
           'metadata': {'description': {'long': 'University of Minnesota, '
                                        'Global Landscapes Initiative - '
                                        'maize crop model.',
                                        'short': 'Maize crop model'},
                        'author': ['James S. Gerber'],
                        'publication_year': 2011,
                        'web_site': 'http://malthus.cfans.umn.edu/Google/',
                        'institution': 'University of Minnesota',
                        'institution_web_site': 'http://www.umn.edu/',
                        'institution_logo': 'UMN.gif'}}
  sources[table['id']] = table

  table = {'id': 'umn.Precip',
           'backend': {'id': 'BQ', 'name': 'BigQuery'},
           'name': 'WorldClim annual mean precipitation',
           'latitude': 'latitude', 'longitude': 'longitude',
           'fields': {'latitude': {'type': 'float'},
                      'longitude': {'type': 'float'},
                      'precip': {'name': 'Precipitation [mm/y]',
                                 'type': 'float',
                                 'min': 0, 'max': 10000,
                                 'display': 'grid'}},
           'lat_delta': 0.08334, 'lon_delta': 0.08334,
           'metadata': {'description': {'long': 'University of Minnesota, '
                                        'Global Landscapes Initiative - Annual'
                                        ' Mean Precipitation.',
                                        'short': 'GLI Precipitation'},
                        'author': ['James S. Gerber'],
                        'publication_year': 2011,
                        'web_site': 'http://malthus.cfans.umn.edu/Google/',
                        'institution': 'University of Minnesota',
                        'institution_web_site': 'http://www.umn.edu/',
                        'institution_logo': 'UMN.gif'}}
  sources[table['id']] = table

  table = {'id': 'umn.npki',
           'backend': {'id': 'BQ', 'name': 'BigQuery'},
           'name': 'Fertilizer and irrigation application for GLI',
           'latitude': 'latitude', 'longitude': 'longitude',
           'fields': {'latitude': {'type': 'float'},
                      'longitude': {'type': 'float'},
                      'year': {'type': 'integer'},
                      'maizeN': {'name': 'Nitrogen for maize',
                                 'type': 'float',
                                 'min': 0, 'max': 352,
                                 'display': 'grid'},
                      'maizeP2O5': {'name': 'Phosphorus for maize',
                                    'type': 'float',
                                    'min': 0, 'max': 340,
                                    'display': 'grid'},
                      'maizeK2O': {'name': 'Potassium for maize',
                                   'type': 'float',
                                   'min': 0, 'max': 400,
                                   'display': 'grid'},
                      'maizeI': {'name': 'Irrigation fraction for maize',
                                 'type': 'float',
                                 'min': 0, 'max': 1,
                                 'display': 'grid'}},
           'lat_delta': 0.08334, 'lon_delta': 0.08334,
           'metadata': {'description': {'long': 'University of Minnesota, '
                                        'Global Landscapes Initiative - '
                                        'Application of fertilizer and water.',
                                        'short': 'GLI Management'},
                        'author': ['James S. Gerber'],
                        'publication_year': 2000,
                        'web_site': 'http://malthus.cfans.umn.edu/Google/',
                        'institution': 'University of Minnesota',
                        'institution_web_site': 'http://www.umn.edu/',
                        'institution_logo': 'UMN.gif'}}
  sources[table['id']] = table

  return sources
