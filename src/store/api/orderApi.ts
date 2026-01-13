import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.ORDER_SERVICE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      const user = state.auth.user;

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (user?.id) {
        headers.set('X-User-Id', user.id);
      }
      if (user?.type) {
        headers.set('X-User-Type', user.type);
      }
      if (user?.storeId) {
        headers.set('X-User-Store-Id', user.storeId);
      }

      return headers;
    },
  }),
  tagTypes: ['Orders'],
  endpoints: (builder) => ({
    getOrdersByStatus: builder.query({
      query: (status: string) => `/orders/status/${status}`,
      providesTags: ['Orders'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ orderId, status }: { orderId: string; status: string }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Orders'],
    }),
  }),
});

export const {
  useGetOrdersByStatusQuery,
  useUpdateOrderStatusMutation,
} = orderApi;
