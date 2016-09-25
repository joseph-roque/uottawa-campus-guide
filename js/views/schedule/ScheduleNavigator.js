/**
 *
 * @license
 * Copyright (C) 2016 Joseph Roque
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
 * @file ScheduleNavigator.js
 * @providesModule Schedule
 * @description Navigator for managing views for viewing and updating a schedule
 *
 * @flow
 */
'use strict';

// React imports
import React from 'react';
import {
  Navigator,
  StyleSheet,
  View,
} from 'react-native';

// Type imports
import type {
  Route,
} from 'types';

// Imports
const Constants = require('Constants');

// Screen imports
const ScheduleHome = require('ScheduleHome');

class ScheduleNavigator extends React.Component {

  constructor(props: {}) {
    super(props);

    (this:any)._nextScreen = this._nextScreen.bind(this);
  }

  /**
   * Sets the transition between two views in the navigator.
   *
   * @returns {Object} a configuration for the transition between scenes.
   */
  _configureScene(): Object {
    return Navigator.SceneConfigs.PushFromRight;
  }

  _nextScreen(id: number, data: Object): void {
    this.refs.Navigator.push({
      id: id,
      data: data,
    });
  }

  /**
   * Renders a view according to the current route of the navigator.
   *
   * @param {Route} route object with properties to identify the route to display.
   * @returns {ReactElement<any>} the view to render, based on {route}.
   */
  _renderScene(route: Route): ReactElement < any > {
    switch (route.id) {
      case Constants.Views.Schedule.Home:
        return (
          <ScheduleHome />
        );
      default:
        return (<View style={_styles.container} />);
    }
  }

  /**
   * Returns a navigator for subnavigation between class finding components.
   *
   * @returns {ReactElement<any>} the hierarchy of views to render
   */
  render(): ReactElement < any > {
    return (
      <Navigator
          configureScene={this._configureScene}
          initialRoute={{id: Constants.Views.Schedule.Home}}
          ref='Navigator'
          renderScene={this._renderScene.bind(this)}
          style={_styles.container} />
    );
  }
}

// Private styles for component
const _styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

module.exports = ScheduleNavigator;
