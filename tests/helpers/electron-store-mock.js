/**
 * 内存版 electron-store，供 ConfigManager 等主进程测试使用。
 */
export class MemoryStore {
  constructor (options = {}) {
    this.name = options.name || 'store'
    this.store = { ...(options.defaults || {}) }
  }

  get (key, defaultValue) {
    if (key === undefined) {
      return this.store
    }
    return Object.prototype.hasOwnProperty.call(this.store, key)
      ? this.store[key]
      : defaultValue
  }

  set (key, value) {
    if (typeof key === 'object' && key !== null) {
      Object.assign(this.store, key)
      return
    }
    this.store[key] = value
  }

  delete (key) {
    delete this.store[key]
  }

  clear () {
    this.store = {}
  }
}
