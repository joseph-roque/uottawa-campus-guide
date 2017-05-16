/**
 *
 * @license
 * Copyright (C) 2016-2017 Joseph Roque
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Joseph Roque
 * @created 2016-11-6
 * @file buildings.js
 * @description Describes how buildings in the app should be searched.
 *
 * @flow
 */
'use strict';

// React imports
import { Platform } from 'react-native';

// Types
import type { Building, Language, RoomType, Section } from 'types';
import type { SearchResult } from '../Searchable';

// Imports
import Promise from 'promise';
import * as Configuration from 'Configuration';
import * as Constants from 'Constants';
import * as DisplayUtils from 'DisplayUtils';
import * as Translations from 'Translations';

/**
 * Returns a promise containing a list of buildings which match the search terms.
 *
 * @param {string}          key         key for the results
 * @param {Language}        language    the current language
 * @param {string}          searchTerms the search terms for the query
 * @param {Array<Building>} buildings   list of buildings
 * @returns {Promise<Array<SearchResult>>} promise which resolves with the results of the search, containing buildings
 */
function _getBuildingResults(key: string,
                             language: Language,
                             searchTerms: string,
                             buildings: Array < any >): Promise < Array < SearchResult > > {

  /* FIXME: replace buildings: Array < any > with buildings: Array < Building > */

  return new Promise((resolve) => {
    const results: Array < SearchResult > = [];

    for (let i = 0; i < buildings.length; i++) {
      const translated: boolean = !('name' in buildings[i]);
      const name: string = Translations.getName(language, buildings[i]) || '';
      const matchedTerms: Array < string > = [];

      // Compare building properties to search terms to add to results
      if (!translated && buildings[i].name.toUpperCase().indexOf(searchTerms) >= 0) {
        matchedTerms.push(buildings[i].name.toUpperCase());
      } else if (translated &&
          (buildings[i].name_en.toUpperCase().indexOf(searchTerms) >= 0
          || buildings[i].name_fr.toUpperCase().indexOf(searchTerms) >= 0)) {
        matchedTerms.push(buildings[i].name_fr.toUpperCase());
        matchedTerms.push(buildings[i].name_en.toUpperCase());
      }

      if (buildings[i].shorthand.toUpperCase().indexOf(searchTerms) >= 0) {
        matchedTerms.push(buildings[i].shorthand.toUpperCase());
      }

      if (matchedTerms.length > 0) {
        results.push({
          key,
          description: name,
          data: buildings[i],
          icon: {
            name: 'store',
            class: 'material',
          },
          matchedTerms: matchedTerms,
          title: buildings[i].shorthand,
        });
      }
    }

    resolve(results);
  });
}

/**
 * Returns a promise containing a list of rooms which match the search terms.
 *
 * @param {string}          key         key for the results
 * @param {Language}        language    the current language
 * @param {string}          searchTerms the search terms for the query.
 * @param {Array<Building>} buildings   list of buildings
 * @returns {Promise<Array<SearchResult>>} promise which resolves with the results of the search, containing rooms
 */
function _getRoomResults(key:string,
                         language: Language,
                         searchTerms: string,
                         buildings: Array < Building >): Promise < Array < SearchResult > > {
  return new Promise((resolve, reject) => {
    Configuration.init()
        .then(() => Configuration.getConfig('/room_types.json'))
        .then((roomTypes: Array < RoomType >) => {
          const results: Array < SearchResult > = [];

          // Cache list of room types that match the search terms
          const matchingRoomTypes = [];
          for (let i = 0; i < roomTypes.length; i++) {
            const roomTypeName = Translations.getName(language, roomTypes[i]);
            if (roomTypeName != null && roomTypeName.toUpperCase().indexOf(searchTerms) >= 0) {
              matchingRoomTypes.push(i);
            }
          }

          for (let i = 0; i < buildings.length; i++) {
            const building: Building = buildings[i];

            for (let j = 0; j < building.rooms.length; j++) {
              const room = building.rooms[j];
              const roomName: string = `${building.shorthand} ${room.name.toUpperCase()}`;
              const roomAltName: ?string = Translations.getVariant(language, 'alt_name', room);

              if (!room.type) {
                room.type = Constants.DefaultRoomType;
              }

              if (matchingRoomTypes.indexOf(room.type) >= 0
                  || roomName.toUpperCase().indexOf(searchTerms) >= 0
                  || (roomAltName != null && roomAltName.toUpperCase().indexOf(searchTerms) >= 0)) {
                const description = Translations.getName(language, roomTypes[room.type]) || '';
                const icon = DisplayUtils.getPlatformIcon(Platform.OS, roomTypes[room.type]);

                const matchedTerms = [ roomName.toUpperCase(), description.toUpperCase() ];
                if (roomAltName != null) {
                  matchedTerms.push(roomAltName.toUpperCase());
                }

                results.push({
                  key,
                  description: description,
                  data: { building: building, shorthand: building.shorthand, room: room.name },
                  icon: icon || { name: 'search', class: 'material' },
                  matchedTerms: matchedTerms,
                  title: `${building.shorthand} ${room.name}`,
                });
              }
            }
          }

          resolve(results);
        })
        .catch((err: any) => reject(err));
  });
}

/**
 * Returns a promise containing a list of buildings and rooms which match the search terms.
 *
 * @param {Language} language    the current language
 * @param {?string}  searchTerms the search terms for the query.
 * @returns {Promise<Array<Section<SearchResult>>>} promise which resolves with the results of the search,
 *                                                  containing buildings and rooms
 */
export function getResults(language: Language, searchTerms: ?string):
    Promise < Array < Section < SearchResult > > > {
  return new Promise((resolve, reject) => {
    if (searchTerms == null || searchTerms.length === 0) {
      resolve([]);
      return;
    }

    // Ignore the case of the search terms
    const adjustedSearchTerms: string = searchTerms.toUpperCase();
    const buildings: Array < Building > = require('../../../../assets/js/Buildings');

    const buildingTranslation = Translations.get(language, 'buildings');
    const roomTranslation = Translations.get(language, 'rooms');

    Promise.all([
      _getBuildingResults(buildingTranslation, language, adjustedSearchTerms, buildings),
      _getRoomResults(roomTranslation, language, adjustedSearchTerms, buildings),
    ])
        .then((results: Array < Object >) => {
          const sections = [];
          sections.push({
            key: buildingTranslation,
            data: results[0],
          });
          sections.push({
            key: roomTranslation,
            data: results[1],
          });

          resolve(sections);
        })
        .catch((err: any) => reject(err));
  });
}

/**
 * Returns an object which maps the section names to an icon which represents it.
 *
 * @param {Language} language the current language
 * @returns {Object} section names mapped to icon objects
 */
export function getResultIcons(language: Language): Object {
  const icons = {};
  icons[Translations.get(language, 'buildings')] = {
    icon: {
      class: 'material',
      name: 'store',
    },
  };
  icons[Translations.get(language, 'rooms')] = {
    icon: {
      class: 'material',
      name: 'room',
    },
  };

  return icons;
}
