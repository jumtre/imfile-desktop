import { describe, expect, it, vi } from 'vitest'

import { createElectronIsMock } from '../../helpers/electron-mock.js'
import { createElectronLogMock } from '../../helpers/electron-log-mock.js'

vi.mock('electron-is', () => createElectronIsMock())
vi.mock('electron-log', () => createElectronLogMock())

vi.mock('../../../src/main/utils', () => ({
  getEnginePath: vi.fn(() => '/mock/engine'),
  getAria2ConfPath: vi.fn(() => '/mock/aria2.conf'),
  getEngineBinPathByBackend: vi.fn(() => '/mock/aria2c'),
  getSessionPath: vi.fn(() => '/mock/session'),
  getGoAria2SessionJsonPath: vi.fn(() => '/mock/session.json'),
  inferDownloadEngineBackendFromUserStore: vi.fn(() => 'go-aria2')
}))

const { default: Context } = await import('../../../src/main/core/Context.js')

describe('Context', () => {
  it('init 后包含平台与引擎路径信息', () => {
    const configManager = {}
    const ctx = new Context(configManager)
    const all = ctx.get()

    expect(all.platform).toBe(process.platform)
    expect(all.arch).toBe(process.arch)
    expect(all['engine-bin-path']).toBe('/mock/aria2c')
    expect(all['log-path']).toBe('/mock/logs/imfile.log')
  })

  it('get/set 读写单个键', () => {
    const ctx = new Context({})
    ctx.set('custom-key', 'value')
    expect(ctx.get('custom-key')).toBe('value')
  })
})
