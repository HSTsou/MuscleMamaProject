import { createStackNavigator, createBottomTabNavigator, createAppContainer } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Home from './feature/Home/index';
import User from './feature/User';
import HomeIcon from './feature/Home/HomeIcon/index';
import React from 'react';
import {isIOS} from './util/platform';

const HomeTabNavigator = createBottomTabNavigator(
  {
    Home: { screen: Home},
    User: { screen: User},
  },
  {
    defaultNavigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, horizontal, tintColor }) => {
        const { routeName } = navigation.state;
        let IconComponent = Ionicons;
        let iconName;
        if (routeName === 'Home') {
          iconName = isIOS ? 'ios-home' : 'md-home';
          IconComponent = HomeIcon;
        } else if (routeName === 'User') {
          iconName = isIOS ? 'ios-person' : 'md-person';
        }

        return <IconComponent name={iconName} size={25} color={tintColor} />;
      },
    }),
    tabBarOptions: {
      activeTintColor: 'blue',
      inactiveTintColor: 'gray',
    },
  }
);

const AppNavigator = createStackNavigator({
    App: {
      screen: HomeTabNavigator,
    },
});

export default createAppContainer(AppNavigator);
