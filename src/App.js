import React, { Component } from 'react';
import AppNavigator from './route';

class App extends Component {
  constructor(props){
    super(props);

  }
  render() {
    return (
      <AppNavigator />
    );
  }
}

export default App;
