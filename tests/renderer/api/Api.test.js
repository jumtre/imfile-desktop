import { beforeEach, describe, expect, it, vi } from 'vitest'

const ipcInvoke = vi.hoisted(() => vi.fn())
const clientMock = vi.hoisted(() => ({
  open: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
  call: vi.fn(() => Promise.resolve('ok')),
  multicall: vi.fn(() => Promise.resolve([]))
}))

class Aria2Mock {
  constructor () {
    Object.assign(this, clientMock)
  }
}

vi.mock('electron', () => ({
  ipcRenderer: { invoke: ipcInvoke }
}))

vi.mock('electron-is', () => ({
  default: { renderer: () => true }
}))

vi.mock('@shared/aria2', () => ({
  Aria2: Aria2Mock
}))

const { default: Api } = await import('@/api/Api.js')

describe('Api', () => {
  let api

  beforeEach(async () => {
    vi.clearAllMocks()
    ipcInvoke.mockResolvedValue({
      rpcListenPort: 16800,
      rpcSecret: 'secret',
      theme: 'light'
    })
    api = new Api()
    await api.init()
  })

  it('init 后创建 aria2 客户端', () => {
    expect(api.client).toBeTruthy()
    expect(api.client.open).toHaveBeenCalled()
  })

  it('pauseTaskByEngine 按引擎路由', async () => {
    ipcInvoke.mockResolvedValueOnce({ ok: true })
    await api.pauseTaskByEngine({ engine: 'goed2kd', id: 'hash1' })
    expect(ipcInvoke).toHaveBeenCalledWith('goed2kd:pause-download', { hash: 'hash1' })

    await api.pauseTaskByEngine({ engine: 'aria2', gid: 'g1' })
    expect(clientMock.call).toHaveBeenCalledWith('pause', 'g1')
  })

  it('savePreference 空配置直接返回 ok', async () => {
    const result = await api.savePreference({})
    expect(result).toEqual({ ok: true })
    expect(ipcInvoke).not.toHaveBeenCalledWith('application:save-preference', expect.anything())
  })

  it('changeUri 在 method not found 时抛出 CHANGE_URI_NOT_SUPPORTED', async () => {
    clientMock.call.mockRejectedValueOnce({ code: -32601, message: 'Method not found' })
    await expect(api.changeUri({ gid: 'g1', fileIndex: 1, addUris: ['https://x.com'] }))
      .rejects.toMatchObject({ code: 'CHANGE_URI_NOT_SUPPORTED' })
  })

  it('getGlobalOption 将键名转为 camelCase', async () => {
    clientMock.call.mockResolvedValueOnce({ 'max-connection-per-server': '16' })
    const options = await api.getGlobalOption()
    expect(options).toEqual({ maxConnectionPerServer: '16' })
  })
})
