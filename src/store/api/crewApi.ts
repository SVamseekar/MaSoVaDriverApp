// src/store/api/crewApi.ts
// Personal staff data — sessions (clock in/out), shifts (schedule), earnings (coming soon)
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '../../config/api.config';
import type { RootState } from '../store';

// ─── Types ───────────────────────────────────────────────────────────────────

import type { WorkingSession } from '../../types/user';
export type { WorkingSession };

export interface Shift {
  id: string;
  employeeId: string;
  storeId: string;
  scheduledStart: string;
  scheduledEnd: string;
  role?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
}

// Earnings — backend not yet implemented, shape agreed for future
export interface WeeklyEarnings {
  employeeId: string;
  weekStart: string;
  weekEnd: string;
  hoursWorked: number;
  baseHourlyRate?: number;          // not yet in backend
  basePay?: number;                 // not yet in backend
  tips?: number;                    // not yet in backend — Phase 6 feature
  totalEarnings?: number;           // not yet in backend
  dailyBreakdown: Array<{
    date: string;
    hours: number;
    tips?: number;
  }>;
}

// ─── API Slice ────────────────────────────────────────────────────────────────

export const crewApi = createApi({
  reducerPath: 'crewApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.API_GATEWAY_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Session', 'Shift', 'Earnings'],
  endpoints: (builder) => ({

    // ── Sessions (clock in/out) ──────────────────────────────────────────────

    getMyActiveSession: builder.query<WorkingSession | null, string>({
      query: (employeeId) => `/sessions/employee/${employeeId}`,
      transformResponse: (sessions: WorkingSession[]) =>
        sessions.find(s => s.status === 'ACTIVE') ?? null,
      providesTags: ['Session'],
    }),

    getMySessionHistory: builder.query<WorkingSession[], { employeeId: string; limit?: number }>({
      query: ({ employeeId, limit = 10 }) =>
        `/sessions/employee/${employeeId}?limit=${limit}&sort=date,desc`,
      providesTags: ['Session'],
    }),

    clockIn: builder.mutation<WorkingSession, { employeeId: string; storeId: string }>({
      query: (body) => ({ url: '/sessions', method: 'POST', body }),
      invalidatesTags: ['Session'],
    }),

    clockOut: builder.mutation<WorkingSession, { sessionId: string }>({
      query: ({ sessionId }) => ({ url: '/sessions/end', method: 'POST', body: { sessionId } }),
      invalidatesTags: ['Session'],
    }),

    // ── Shifts (schedule) ───────────────────────────────────────────────────

    getMyUpcomingShifts: builder.query<Shift[], { employeeId: string; storeId: string }>({
      query: ({ employeeId, storeId }) =>
        `/shifts?employeeId=${employeeId}&storeId=${storeId}&upcoming=true`,
      providesTags: ['Shift'],
    }),

    getMyShiftHistory: builder.query<Shift[], { employeeId: string }>({
      query: ({ employeeId }) => `/shifts?employeeId=${employeeId}&past=true&limit=10`,
      providesTags: ['Shift'],
    }),

    // ── Earnings — not yet in backend ───────────────────────────────────────
    // Endpoint planned for Phase 6. Returns null until implemented.
    getMyWeeklyEarnings: builder.query<WeeklyEarnings | null, { employeeId: string }>({
      query: ({ employeeId }) => `/staff/earnings/weekly?employeeId=${employeeId}`,
      providesTags: ['Earnings'],
    }),

  }),
});

export const {
  useGetMyActiveSessionQuery,
  useGetMySessionHistoryQuery,
  useClockInMutation,
  useClockOutMutation,
  useGetMyUpcomingShiftsQuery,
  useGetMyShiftHistoryQuery,
  useGetMyWeeklyEarningsQuery,
} = crewApi;
