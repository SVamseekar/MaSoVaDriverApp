import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '../../config/api.config';
import type { RootState } from '../store';

// Types
export interface DeliveryTracking {
  id: string;
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
  };
  customerName: string;
  customerPhone: string;
  orderDetails?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const deliveryApi = createApi({
  reducerPath: 'deliveryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.API_GATEWAY_URL,  // Use API Gateway
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
  tagTypes: ['Deliveries', 'DriverStatus'],
  endpoints: (builder) => ({
    // Get pending deliveries for driver
    getPendingDeliveries: builder.query<DeliveryTracking[], string>({
      query: (driverId) => `/delivery/driver/${driverId}/pending`,
      providesTags: ['Deliveries'],
    }),

    // Get active/assigned deliveries for driver
    getActiveDeliveries: builder.query<DeliveryTracking[], string>({
      query: (driverId) => `/delivery/driver/${driverId}/active`,
      providesTags: ['Deliveries'],
    }),

    // Mark delivery as picked up
    markAsPickedUp: builder.mutation<DeliveryTracking, string>({
      query: (trackingId) => ({
        url: `/delivery/${trackingId}/pickup`,
        method: 'POST',
      }),
      invalidatesTags: ['Deliveries'],
    }),

    // Mark delivery as delivered
    markAsDelivered: builder.mutation<DeliveryTracking, { trackingId: string; notes?: string }>({
      query: ({ trackingId, notes }) => ({
        url: `/delivery/${trackingId}/deliver`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: ['Deliveries'],
    }),

    // Update driver location
    updateLocation: builder.mutation<void, { driverId: string; latitude: number; longitude: number }>({
      query: (data) => ({
        url: '/delivery/location-update',
        method: 'POST',
        body: data,
      }),
    }),

    // Get delivery history
    getDeliveryHistory: builder.query<DeliveryTracking[], { driverId: string; limit?: number }>({
      query: ({ driverId, limit = 20 }) => `/delivery/driver/${driverId}/history?limit=${limit}`,
      providesTags: ['Deliveries'],
    }),
  }),
});

export const {
  useGetPendingDeliveriesQuery,
  useGetActiveDeliveriesQuery,
  useMarkAsPickedUpMutation,
  useMarkAsDeliveredMutation,
  useUpdateLocationMutation,
  useGetDeliveryHistoryQuery,
} = deliveryApi;
