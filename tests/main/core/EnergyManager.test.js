import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createElectronMock, createElectronIsMock } from '../../helpers/electron-mock.js'
import { createElectronLogMock } from '../../helpers/electron-log-mock.js'

const powerSaveBlocker = vi.hoisted(() => ({
  start: vi.fn(() => 42),
  stop: vi.fn(),
  isStarted: vi.fn(() => true)
}))

vi.mock('electron', () => ({
  ...createElectronMock(),
  powerSaveBlocker
}))

vi.mock('electron-is', () => createElectronIsMock())
vi.mock('electron-log', () => createElectronLogMock())

const { default: EnergyManager } = await import('../../../src/main/core/EnergyManager.js')

describe('EnergyManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    powerSaveBlocker.isStarted.mockReturnValue(false)
  })

  afterEach(() => {
    const manager = new EnergyManager()
    manager.stopPowerSaveBlocker()
  })

  it('startPowerSaveBlocker 启动节能阻止', () => {
    const manager = new EnergyManager()
    manager.startPowerSaveBlocker()
    expect(powerSaveBlocker.start).toHaveBeenCalledWith('prevent-app-suspension')
  })

  it('已启动时不重复 start', () => {
    powerSaveBlocker.isStarted.mockReturnValue(false)
    const manager = new EnergyManager()
    manager.startPowerSaveBlocker()
    powerSaveBlocker.isStarted.mockImplementation((id) => id === 42)
    manager.startPowerSaveBlocker()
    expect(powerSaveBlocker.start).toHaveBeenCalledTimes(1)
  })

  it('stopPowerSaveBlocker 停止节能阻止', () => {
    powerSaveBlocker.isStarted.mockReturnValue(true)
    const manager = new EnergyManager()
    manager.startPowerSaveBlocker()
    manager.stopPowerSaveBlocker()
    expect(powerSaveBlocker.stop).toHaveBeenCalledWith(42)
  })
})
