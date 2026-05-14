import { createContext, useContext } from 'react';

export const MyUserContext = createContext(null);
export const MyDispatchContext = createContext(null);

export const useMyUser = () => useContext(MyUserContext);
export const useMyDispatch = () => useContext(MyDispatchContext);