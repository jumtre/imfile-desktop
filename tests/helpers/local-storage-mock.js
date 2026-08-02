import { vi } from 'vitest'

/**
 * 在 node 测试环境中提供可重置的 localStorage 实现。
 */
export function installLocalStorageMock () {
  let store = Object.create(null)

  const localStorage = {
    getItem (key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    },
    setItem (key, value) {
      store[key] = String(value)
    },
    removeItem (key) {
      delete store[key]
    },
    clear () {
      store = Object.create(null)
    }
  }

  vi.stubGlobal('localStorage', localStorage)

  return {
    clear () {
      store = Object.create(null)
    }
  }
}
