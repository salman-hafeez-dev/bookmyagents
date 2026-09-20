import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { dashboardApi } from "./api/dashboardApi";
import { siteApi } from "./api/siteApi";

const store = configureStore({
   reducer: {
      [dashboardApi.reducerPath]: dashboardApi.reducer,
      [siteApi.reducerPath]: siteApi.reducer,
   },
   middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
         serializableCheck: false,
      }).concat(dashboardApi.middleware, siteApi.middleware),
});

// Enables refetchOnFocus/refetchOnReconnect for the RTK Query caches.
// siteApi opts out of focus refetching in its own definition.
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;

export default store;