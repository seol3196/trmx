// 테스트 환경 설정
global.fetch = jest.fn();

// IndexedDB 모킹
const mockIDBFactory = {
  open: jest.fn(),
};

const mockIDBRequest = {
  onupgradeneeded: null,
  onsuccess: null,
  onerror: null,
  result: {
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue({
        put: jest.fn().mockReturnValue({
          onsuccess: null,
          onerror: null
        }),
        get: jest.fn().mockReturnValue({
          onsuccess: null,
          onerror: null
        }),
        getAll: jest.fn().mockReturnValue({
          onsuccess: null,
          onerror: null
        }),
        delete: jest.fn().mockReturnValue({
          onsuccess: null,
          onerror: null
        }),
        add: jest.fn().mockReturnValue({
          onsuccess: null,
          onerror: null
        })
      })
    }),
    objectStoreNames: {
      contains: jest.fn().mockReturnValue(true)
    },
    createObjectStore: jest.fn().mockReturnValue({
      createIndex: jest.fn()
    })
  }
};

// IndexedDB 모킹 설정
Object.defineProperty(window, 'indexedDB', {
  value: mockIDBFactory
});

// 네트워크 상태 모킹
Object.defineProperty(navigator, 'onLine', {
  configurable: true,
  get: jest.fn().mockReturnValue(true)
});

// localStorage 모킹
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
}); 