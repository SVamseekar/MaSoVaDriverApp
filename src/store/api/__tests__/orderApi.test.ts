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

async function readBody(input: RequestInfo | URL, init?: RequestInit): Promise<string> {
  if (typeof init?.body === 'string') {
    return init.body;
  }
  if (typeof input !== 'string' && !(input instanceof URL)) {
    return input.clone().text();
  }
  return '';
}

function jsonResponse(body: unknown) {
  const text = JSON.stringify(body);
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => text,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null),
    },
    clone() {
      return this;
    },
  };
}

describe('orderApi commerce contract', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('lists orders with GET /orders?status=DISPATCHED', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    const store = createStore();
    const query = store.dispatch(orderApi.endpoints.getOrdersByStatus.initiate('DISPATCHED'));
    await query;

    expect(fetchMock).toHaveBeenCalled();
    const [input, init] = fetchMock.mock.calls[0];
    const url = requestUrl(input);
    const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET') || 'GET').toUpperCase();
    expect(method).toBe('GET');
    expect(url).toContain('/orders?status=DISPATCHED');
    expect(url).not.toContain('/orders/status/');
    query.unsubscribe();
  });

  it('posts status updates to /orders/{id}/status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'ord_1', status: 'DELIVERED' }));
    const store = createStore();
    await store.dispatch(
      orderApi.endpoints.updateOrderStatus.initiate({
        orderId: 'ord_1',
        status: 'DELIVERED',
      }),
    );

    expect(fetchMock).toHaveBeenCalled();
    const [input, init] = fetchMock.mock.calls[0];
    const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : '')).toUpperCase();
    expect(method).toBe('POST');
    expect(requestUrl(input)).toContain('/orders/ord_1/status');
    expect(JSON.parse(await readBody(input, init))).toEqual({ status: 'DELIVERED' });
  });

  it('unwraps paged list content and keeps a bare array', async () => {
    const page = {
      content: [{ id: 'ord_1', assignedDriverId: 'drv_1' }],
      page: 0,
      size: 20,
      totalElements: 1,
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(page));
    const store = createStore();
    const paged = await store.dispatch(orderApi.endpoints.getOrdersByStatus.initiate('DISPATCHED'));
    expect(paged.data).toEqual(page.content);

    fetchMock.mockResolvedValueOnce(jsonResponse(page.content));
    const store2 = createStore();
    const raw = await store2.dispatch(orderApi.endpoints.getOrdersByStatus.initiate('DELIVERED'));
    expect(raw.data).toEqual(page.content);
  });
});
