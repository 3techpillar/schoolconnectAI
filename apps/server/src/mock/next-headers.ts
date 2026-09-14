import { asyncLocalStorage } from "@/lib/server/express-wrapper.js";

class MockCookies {
  get(name: string) {
    const store = asyncLocalStorage.getStore();
    if (!store) return undefined;
    const value = store.req.cookies?.[name];
    if (value === undefined) return undefined;
    return { name, value };
  }

  set(name: string, value: string, options?: any) {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store.res.cookie(name, value, options);
    }
  }

  delete(name: string) {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store.res.clearCookie(name);
    }
  }
}

export async function cookies() {
  return new MockCookies();
}

export async function headers() {
  const store = asyncLocalStorage.getStore();
  const h = new Headers();
  if (store) {
    for (const [key, value] of Object.entries(store.req.headers)) {
      if (Array.isArray(value)) {
        value.forEach(v => h.append(key, v));
      } else if (value !== undefined) {
        h.append(key, value);
      }
    }
  }
  return h;
}
