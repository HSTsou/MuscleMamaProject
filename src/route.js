import { createStackNavigator, createAppContainer } from 'react-navigation';
import Home from './feature/Home/index';


const AppNavigator = createStackNavigator({
    Home: {
      screen: Home,
    },
  });

export default createAppContainer(AppNavigator);
