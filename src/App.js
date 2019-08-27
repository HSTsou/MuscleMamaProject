import React, { Component } from 'react';
import AppNavigator from './route';

class App extends Component {
  constructor(props){
    super(props);

  }

  handleNavigationChange = (prevState, newState, action) => {
    console.log('AppNavigator prevState, newState, action', prevState, newState, action);
  }

  render() {
    return (
      <AppNavigator
        onNavigationStateChange={this.handleNavigationChange}
      />
    );
  }
}

export default App;
