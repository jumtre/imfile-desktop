import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Aria2', () => {
  let fetchMock
  let Aria2

  beforeEach(async () => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn()
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()
    const mod = await import('@shared/aria2/lib/Aria2.js')
    Aria2 = mod.Aria2
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('prefix 为 aria2 方法补全前缀', () => {
    const client = new Aria2()
    expect(client.prefix('getVersion')).toBe('aria2.getVersion')
    expect(client.prefix('aria2.tellActive')).toBe('aria2.tellActive')
    expect(client.prefix('system.listMethods')).toBe('system.listMethods')
  })

  it('unprefix 去掉 aria2 前缀', () => {
    const client = new Aria2()
    expect(client.unprefix('aria2.getVersion')).toBe('getVersion')
    expect(client.unprefix('system.listMethods')).toBe('system.listMethods')
  })

  it('addSecret 注入 token 参数', () => {
    const client = new Aria2({ secret: 'abc' })
    expect(client.addSecret(['arg1'])).toEqual(['token:abc', 'arg1'])
    expect(client.addSecret()).toEqual(['token:abc'])
  })

  it('call 自动补全 method 前缀并附加 secret', async () => {
    const client = new Aria2({ host: '127.0.0.1', port: 16800, secret: 'secret' })
    client._send = vi.fn().mockResolvedValue(undefined)

    const resultPromise = client.call('getVersion')
    await Promise.resolve()
    const id = Number(Object.keys(client.deferreds)[0])
    client._onresponse({ id, result: 'ok' })

    await expect(resultPromise).resolves.toBe('ok')
    expect(client._send).toHaveBeenCalledWith(expect.objectContaining({
      method: 'aria2.getVersion',
      params: ['token:secret']
    }))
  })
})
