import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API slices
import { driverApi } from './api/driverApi';
import { orderApi } from './api/orderApi';
import { deliveryApi } from './api/deliveryApi';
import { crewApi } from './api/crewApi';

// Slice reducers
import authReducer from './slices/authSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Only persist auth state
};

const rootReducer = combineReducers({
  // Feature slices
  auth: authReducer,

  // RTK Query API slices
  [driverApi.reducerPath]: driverApi.reducer,
  [orderApi.reducerPath]: orderApi.reducer,
  [deliveryApi.reducerPath]: deliveryApi.reducer,
  [crewApi.reducerPath]: crewApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      driverApi.middleware,
      orderApi.middleware,
      deliveryApi.middleware,
      crewApi.middleware
    ),
  devTools: __DEV__, // Enable Redux DevTools in development
});

// Enable listener behavior for the store
setupListeners(store.dispatch);

// Export persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
