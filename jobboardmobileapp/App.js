import { MyDispatchContext, MyUserContext } from "./configs/Contexts";
import { NavigationContainer } from '@react-navigation/native';
import {useReducer} from 'react';
import UserReducer from './reducers/UserReducer';
import MainNavigator from "./components/MainNavigator";
import { StripeProvider } from '@stripe/stripe-react-native';
export default function App(){
  const [user, dispatch] = useReducer(UserReducer, null);

  return (
    <StripeProvider publishableKey="pk_test_51TSVvpHi1qV8vjTTONcdOjMqQEEJWVo9SLHZMqvnp9XldsBsr5la5QiifZGxwCOc2wp5Vrh57aVL1oiDC4Bqme1b00FcA5l6VG"
      merchantIdentifier="merchant.com.jobboard">
      <MyUserContext.Provider value={user}>
        <MyDispatchContext.Provider value={dispatch}>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </MyDispatchContext.Provider>
      </MyUserContext.Provider>
    </StripeProvider>
  )
}