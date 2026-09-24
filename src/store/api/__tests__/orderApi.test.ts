import { configureStore } from '@reduxjs/toolkit';
import { orderApi } from '../orderApi';
import authReducer from '../../slices/authSlice';

function createStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [orderApi.reducerPath]: orderApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(orderApi.middleware),
  });
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) {
    return init.method;
  }
  if (typeof input !== 'string' && !(input instanceof URL) && input.method) {
    return input.method;
  }
  return 'GET';
}

describe('orderApi commerce contract', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
      text: async () => '[]',
      headers: {
        get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      clone() {
        return this;
      },
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('lists orders with a status query param', async () => {
    const store = createStore();
    const query = store.dispatch(orderApi.endpoints.getOrdersByStatus.initiate('DISPATCHED'));
    await query;

    expect(fetchMock).toHaveBeenCalled();
    const [input] = fetchMock.mock.calls[0];
    const url = requestUrl(input);
    expect(url).toContain('/orders?status=DISPATCHED');
    expect(url).not.toContain('/orders/status/');
    query.unsubscribe();
  });

  it('posts order status updates', async () => {
    const store = createStore();
    await store.dispatch(
      orderApi.endpoints.updateOrderStatus.initiate({
        orderId: 'ord_1',
        status: 'DELIVERED',
      }),
    );

    expect(fetchMock).toHaveBeenCalled();
    const [input, init] = fetchMock.mock.calls[0];
    const url = requestUrl(input);
    expect(url).toContain('/orders/ord_1/status');
    expect(requestMethod(input, init).toUpperCase()).toBe('POST');
    expect(url).not.toContain('/orders/status/');
  });
});
