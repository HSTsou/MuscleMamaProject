import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { Component } from 'react';
import {
    View,
    Text,
} from 'react-native';


export default class HomeIcon extends Component {
    render() {
      const { name = '', badgeCount = 1, color = 'black', size } = this.props;
      return (
        <View style={{ width: 24, height: 24, margin: 5 }}>
          <Ionicons name={name} size={size} color={color} />
          { badgeCount > 0 && (
            <View style={{
              position: 'absolute',
              right: -6,
              top: -3,
              backgroundColor: 'red',
              borderRadius: 6,
              width: 12,
              height: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{badgeCount}</Text>
            </View>
          )}
        </View>
      );
    }
  }
