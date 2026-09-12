import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import cartSlice, { hydrateCart } from "./features/cartSlice";
import productSlice from "./features/productSlice";
import wishlistSlice from "./features/wishlistSlice";
import { dashboardApi } from "./api/dashboardApi";

const store = configureStore({
   reducer: {
      products: productSlice,
      cart: cartSlice,
      wishlist: wishlistSlice,
      [dashboardApi.reducerPath]: dashboardApi.reducer,
   },
   middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
         serializableCheck: false,
      }).concat(dashboardApi.middleware),
});

// Enables refetchOnFocus/refetchOnReconnect for dashboardApi queries.
setupListeners(store.dispatch);

store.dispatch(hydrateCart());
export type RootState = ReturnType<typeof store.getState>;

export default store;