import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createElectronLogMock } from '../../helpers/electron-log-mock.js'

const aria2Call = vi.hoisted(() => vi.fn(() => Promise.resolve('ok')))

class Aria2Mock {
  constructor (options) {
    this.options = options
    this.call = aria2Call
  }
}

vi.mock('@shared/aria2', () => ({
  Aria2: Aria2Mock
}))

vi.mock('electron-log', () => createElectronLogMock())

const { default: EngineClient } = await import('../../../src/main/core/EngineClient.js')

describe('EngineClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('connect 时使用传入的 RPC 配置', () => {
    const client = new EngineClient({ host: '10.0.0.1', port: 16801, secret: 'abc' })
    expect(client.client).toBeTruthy()
    expect(client.client.options).toMatchObject({
      host: '10.0.0.1',
      port: 16801,
      secret: 'abc'
    })
  })

  it('call 委托给 aria2 客户端', async () => {
    const client = new EngineClient()
    await client.call('getVersion')
    expect(aria2Call).toHaveBeenCalledWith('getVersion')
  })

  it('call 失败时记录警告并返回 undefined', async () => {
    aria2Call.mockRejectedValueOnce(new Error('rpc down'))
    const client = new EngineClient()
    await expect(client.call('getVersion')).resolves.toBeUndefined()
  })

  it('shutdown 调用 shutdown 并传入 secret', async () => {
    const client = new EngineClient({ secret: 'token' })
    await client.shutdown()
    expect(aria2Call).toHaveBeenCalledWith('shutdown', 'token')
  })

  it('force shutdown 使用 forceShutdown 方法', async () => {
    const client = new EngineClient({ secret: 'token' })
    await client.shutdown({ force: true })
    expect(aria2Call).toHaveBeenCalledWith('forceShutdown', 'token')
  })
})
