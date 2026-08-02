import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ADD_TASK_TYPE } from '@shared/constants'
import { createElectronIsMock, createElectronMock } from '../../helpers/electron-mock.js'
import { createElectronLogMock } from '../../helpers/electron-log-mock.js'

const execFile = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
  execFile
}))

vi.mock('electron', () => createElectronMock())
vi.mock('electron-is', () => createElectronIsMock({ dev: () => false, mas: () => false, windows: () => false }))
vi.mock('electron-log', () => createElectronLogMock())

const { default: ProtocolManager } = await import('../../../src/main/core/ProtocolManager.js')

describe('ProtocolManager', () => {
  let sendCommandToAll

  beforeEach(() => {
    sendCommandToAll = vi.fn()
    global.application = { sendCommandToAll }
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete global.application
  })

  it('handleResourceProtocol 发送 new-task 命令', () => {
    const manager = new ProtocolManager({ protocols: {} })
    manager.handleResourceProtocol('magnet:?xt=urn:btih:abc')

    expect(sendCommandToAll).toHaveBeenCalledWith('application:new-task', {
      type: ADD_TASK_TYPE.URI,
      uri: 'magnet:?xt=urn:btih:abc'
    })
  })

  it('handleMoProtocol 解析 mo 协议命令', () => {
    const manager = new ProtocolManager({ protocols: {} })
    manager.handleMoProtocol('mo://preferences?foo=bar')

    expect(sendCommandToAll).toHaveBeenCalledWith(
      'application:preferences',
      expect.objectContaining({ foo: 'bar' })
    )
  })

  it('handle 根据协议类型分发', () => {
    const manager = new ProtocolManager({ protocols: {} })
    const resourceSpy = vi.spyOn(manager, 'handleResourceProtocol')
    const moSpy = vi.spyOn(manager, 'handleMoProtocol')

    manager.handle('https://example.com/file.zip')
    manager.handle('mo://new-task')

    expect(resourceSpy).toHaveBeenCalled()
    expect(moSpy).toHaveBeenCalled()
  })

  it('queryRegDefaultValue 根据 reg 输出判断', async () => {
    const manager = new ProtocolManager({ protocols: {} })
    vi.spyOn(manager, 'runReg').mockResolvedValue('imFile.torrent default')

    await expect(manager.queryRegDefaultValue('HKCU\\Software\\Classes\\.torrent')).resolves.toBe(true)
  })
})
