import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LOGIN_SETTING_OPTIONS } from '@shared/constants'
import { createElectronMock } from '../../helpers/electron-mock.js'

const getLoginItemSettings = vi.hoisted(() => vi.fn(() => ({ openAtLogin: false })))
const setLoginItemSettings = vi.hoisted(() => vi.fn())

vi.mock('electron', () => ({
  ...createElectronMock(),
  app: {
    ...createElectronMock().app,
    getLoginItemSettings,
    setLoginItemSettings
  }
}))

const { default: AutoLaunchManager } = await import('../../../src/main/core/AutoLaunchManager.js')

describe('AutoLaunchManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getLoginItemSettings.mockReturnValue({ openAtLogin: false })
  })

  it('enable 设置开机启动', async () => {
    const manager = new AutoLaunchManager()
    await manager.enable()
    expect(setLoginItemSettings).toHaveBeenCalledWith({
      ...LOGIN_SETTING_OPTIONS,
      openAtLogin: true
    })
  })

  it('enable 在已启用时仍 resolve', async () => {
    getLoginItemSettings.mockReturnValue({ openAtLogin: true })
    const manager = new AutoLaunchManager()
    await expect(manager.enable()).resolves.toBeUndefined()
  })

  it('disable 关闭开机启动', async () => {
    const manager = new AutoLaunchManager()
    await manager.disable()
    expect(setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: false })
  })

  it('isEnabled 返回当前状态', async () => {
    getLoginItemSettings.mockReturnValue({ openAtLogin: true })
    const manager = new AutoLaunchManager()
    await expect(manager.isEnabled()).resolves.toBe(true)
  })
})
