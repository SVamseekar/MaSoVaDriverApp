import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableNumber?: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number; customizations?: string; allergens?: string[] }>;
  specialInstructions?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
}

export interface StaffOrderRequest {
  storeId: string;
  customerName: string;
  orderType: 'TAKEAWAY' | 'DINE_IN';
  tableNumber?: string;
  paymentMethod: 'CASH';
  createdByStaffId: string;
  items: Array<{ menuItemId: string; name: string; quantity: number; price: number }>;
}

export interface TodayAnalytics {
  todayRevenue: number;
  activeOrders: number;
  avgPrepTime: number;
  activeStaff: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  orderType: string;
  customerName: string;
  status: string;
  total: number;
}

// ─── API Slice ────────────────────────────────────────────────────────────────

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
    // Existing endpoints
    getOrdersByStatus: builder.query({
      query: (status: string) => `/orders?status=${encodeURIComponent(status)}`,
      providesTags: ['Orders'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ orderId, status }: { orderId: string; status: string }) => ({
        url: `/orders/${orderId}/status`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: ['Orders'],
    }),

    // Kitchen endpoints
    getKitchenOrders: builder.query<KitchenOrder[], string>({
      query: (storeId) => `/orders/kitchen?storeId=${storeId}`,
      providesTags: ['Orders'],
    }),
    advanceOrderStage: builder.mutation<void, string>({
      query: (orderId) => ({
        url: `/orders/${orderId}/next-stage`,
        method: 'POST',
      }),
      invalidatesTags: ['Orders'],
    }),

    // Cashier endpoints
    getMenuItems: builder.query<MenuItem[], string>({
      query: (storeId) => `/menu?storeId=${storeId}&available=true`,
      transformResponse: (res: { content: MenuItem[] } | MenuItem[]) =>
        Array.isArray(res) ? res : res.content,
    }),
    placeStaffOrder: builder.mutation<{ id: string; orderNumber: string }, StaffOrderRequest>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Orders'],
    }),

    // Manager endpoints
    getTodayAnalytics: builder.query<TodayAnalytics, string>({
      query: (storeId) => `/analytics/sales?period=today&storeId=${storeId}`,
    }),
    getRecentOrders: builder.query<RecentOrder[], string>({
      query: (storeId) => `/orders?storeId=${storeId}&limit=5`,
      transformResponse: (res: { content: RecentOrder[] } | RecentOrder[]) =>
        Array.isArray(res) ? res : res.content,
      providesTags: ['Orders'],
    }),
  }),
});

export const {
  useGetOrdersByStatusQuery,
  useUpdateOrderStatusMutation,
  useGetKitchenOrdersQuery,
  useAdvanceOrderStageMutation,
  useGetMenuItemsQuery,
  usePlaceStaffOrderMutation,
  useGetTodayAnalyticsQuery,
  useGetRecentOrdersQuery,
} = orderApi;
