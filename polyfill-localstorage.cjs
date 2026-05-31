// Node.js 25 exposes a localStorage global without a backing store, so getItem
// et al. are undefined. Several bundled packages (e.g. @typescript/vfs) call
// localStorage.getItem() at module-load time and crash. This polyfill makes the
// stub functional before any modules are loaded (loaded via --require).
if (
  typeof globalThis.localStorage !== "undefined" &&
  typeof globalThis.localStorage.getItem !== "function"
) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(String(key)) ?? null,
    setItem: (key, val) => store.set(String(key), String(val)),
    removeItem: (key) => store.delete(String(key)),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (n) => [...store.keys()][n] ?? null,
  };
}
