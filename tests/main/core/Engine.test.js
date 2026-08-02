import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createElectronIsMock } from '../../helpers/electron-mock.js'
import { createElectronLogMock } from '../../helpers/electron-log-mock.js'

const existsSync = vi.hoisted(() => vi.fn())
const statSync = vi.hoisted(() => vi.fn())

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    existsSync,
    statSync
  }
})

vi.mock('electron-is', () => createElectronIsMock())
vi.mock('electron-log', () => createElectronLogMock())

vi.mock('../../../src/main/ui/Locale', () => ({
  getI18n: () => ({ t: (key) => key })
}))

vi.mock('../../../src/main/utils/index', () => ({
  ENGINE_BACKEND: { ARIA2: 'aria2', GO_ARIA2: 'go-aria2' },
  getEnginePidPath: vi.fn(() => '/tmp/engine.pid'),
  getEngineBinPathByBackend: vi.fn(() => '/tmp/aria2c'),
  getAria2ConfPath: vi.fn(() => '/tmp/aria2.conf'),
  getSessionPath: vi.fn(() => '/tmp/session.txt'),
  getUserDownloadsPath: vi.fn(() => '/downloads'),
  getGoAria2DataDir: vi.fn(() => '/tmp/go-aria2'),
  getGoAria2SessionJsonPath: vi.fn(() => '/tmp/session.json'),
  getGoAria2MigrationConfPath: vi.fn(() => '/tmp/migrate.conf'),
  isGoAria2EngineBin: vi.fn(() => false),
  transformConfig: vi.fn((cfg) => cfg)
}))

const { default: Engine } = await import('../../../src/main/core/Engine.js')

describe('Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('shouldRunMigrateFromAria2', () => {
    it('无 legacy session 时返回 false', () => {
      existsSync.mockReturnValue(false)
      expect(Engine.shouldRunMigrateFromAria2()).toBe(false)
    })

    it('legacy session 非空且 go session 不存在时返回 true', () => {
      existsSync.mockImplementation((p) => p === '/tmp/session.txt')
      statSync.mockReturnValue({ size: 128 })
      expect(Engine.shouldRunMigrateFromAria2()).toBe(true)
    })

    it('legacy session 为空时返回 false', () => {
      existsSync.mockImplementation((p) => p === '/tmp/session.txt')
      statSync.mockReturnValue({ size: 0 })
      expect(Engine.shouldRunMigrateFromAria2()).toBe(false)
    })

    it('go session 已存在且非空时返回 false', () => {
      existsSync.mockReturnValue(true)
      statSync.mockImplementation((p) => ({
        size: p === '/tmp/session.json' ? 64 : 128
      }))
      expect(Engine.shouldRunMigrateFromAria2()).toBe(false)
    })
  })

  describe('isRunning', () => {
    it('当前进程 pid 应视为运行中', () => {
      const engine = new Engine({ systemConfig: {}, userConfig: {} })
      expect(engine.isRunning(process.pid)).toBe(true)
    })
  })
})
