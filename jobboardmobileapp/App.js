import { MyDispatchContext, MyUserContext } from "./configs/Contexts";
import { NavigationContainer } from '@react-navigation/native';
import {useReducer} from 'react';
import UserReducer from './reducers/UserReducer';
import MainNavigator from "./components/MainNavigator";
export default function App(){
  const [user, dispatch] = useReducer(UserReducer, null);

  return (
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        <NavigationContainer>
          <MainNavigator/>
        </NavigationContainer>
      </MyDispatchContext.Provider>
    </MyUserContext.Provider>
  )
}