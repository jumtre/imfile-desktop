import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PROXY_SCOPES } from '@shared/constants'
import { createElectronIsMock, createElectronMock } from '../../helpers/electron-mock.js'
import { createElectronLogMock } from '../../helpers/electron-log-mock.js'

const autoUpdaterMock = vi.hoisted(() => ({
  autoDownload: true,
  autoInstallOnAppQuit: false,
  logger: { log: vi.fn(), warn: vi.fn() },
  netSession: { setProxy: vi.fn() },
  signals: { login: vi.fn() },
  on: vi.fn(),
  checkForUpdates: vi.fn(),
  downloadUpdate: vi.fn(),
  quitAndInstall: vi.fn()
}))

vi.mock('electron-updater', () => ({
  autoUpdater: autoUpdaterMock
}))

vi.mock('electron', () => createElectronMock())
vi.mock('electron-is', () => createElectronIsMock({ dev: () => true }))
vi.mock('electron-log', () => createElectronLogMock())
vi.mock('../../../src/main/ui/Locale', () => ({
  getI18n: () => ({ t: (key) => key })
}))

const { default: UpdateManager } = await import('../../../src/main/core/UpdateManager.js')

describe('UpdateManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createManager = (overrides = {}) => new UpdateManager({
    autoCheck: false,
    proxy: { enable: false },
    ...overrides
  })

  it('resolveUpdateErrorMessageKey 映射 DNS 错误', () => {
    const manager = createManager()
    expect(manager.resolveUpdateErrorMessageKey(new Error('ERR_NAME_NOT_RESOLVED'))).toBe('app.update-error-dns')
  })

  it('resolveUpdateErrorMessageKey 映射超时错误', () => {
    const manager = createManager()
    expect(manager.resolveUpdateErrorMessageKey(new Error('ERR_CONNECTION_TIMED_OUT'))).toBe('app.update-error-timeout')
  })

  it('resolveUpdateErrorMessageKey 映射校验失败', () => {
    const manager = createManager()
    expect(manager.resolveUpdateErrorMessageKey(new Error('checksum mismatch'))).toBe('app.update-error-checksum')
  })

  it('resolveUpdateErrorMessageKey 未知错误', () => {
    const manager = createManager()
    expect(manager.resolveUpdateErrorMessageKey(new Error('something weird'))).toBe('app.update-error-unknown')
  })

  it('setupProxy 在 scope 包含 update-app 时设置代理', () => {
    createManager({
      proxy: {
        enable: true,
        server: 'http://127.0.0.1:7890',
        scope: [PROXY_SCOPES.UPDATE_APP]
      }
    })
    expect(autoUpdaterMock.netSession.setProxy).toHaveBeenCalledWith({
      proxyRules: 'http://127.0.0.1:7890'
    })
  })

  it('setupProxy 未启用时清除代理', () => {
    createManager({ proxy: { enable: false } })
    expect(autoUpdaterMock.netSession.setProxy).toHaveBeenCalledWith({
      proxyRules: undefined
    })
  })

  it('check 标记为用户主动检查', () => {
    const manager = createManager()
    manager.check()
    expect(manager.autoCheckData.userCheck).toBe(true)
    expect(autoUpdaterMock.checkForUpdates).toHaveBeenCalled()
  })
})
