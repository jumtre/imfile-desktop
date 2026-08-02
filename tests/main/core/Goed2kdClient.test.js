import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const VALID_HASH = '0123456789abcdef0123456789abcdef01234567'

function createJsonResponse (payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(payload)
  }
}

describe('Goed2kdClient', () => {
  let fetchMock
  let Goed2kdClient
  let client

  beforeEach(async () => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()

    const mod = await import('../../../src/main/core/Goed2kdClient.js')
    Goed2kdClient = mod.default
    client = new Goed2kdClient({
      getRuntimeOptions: () => ({
        host: '10.0.0.2',
        port: 19090,
        token: 'secret-token'
      })
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('getBaseUrl 使用运行时 host/port', () => {
    expect(client.getBaseUrl()).toBe('http://10.0.0.2:19090/api/v1')
  })

  it('getBaseUrl 在无运行时配置时使用默认值', async () => {
    const { default: Goed2kdClientClass } = await import('../../../src/main/core/Goed2kdClient.js')
    const defaultClient = new Goed2kdClientClass()
    expect(defaultClient.getBaseUrl()).toBe('http://127.0.0.1:18080/api/v1')
  })

  it('getAuthHeader 有 token 时返回 Bearer', () => {
    expect(client.getAuthHeader()).toEqual({
      Authorization: 'Bearer secret-token'
    })
  })

  it('getAuthHeader 无 token 时返回空对象', async () => {
    const { default: Goed2kdClientClass } = await import('../../../src/main/core/Goed2kdClient.js')
    const noTokenClient = new Goed2kdClientClass()
    expect(noTokenClient.getAuthHeader()).toEqual({})
  })

  it('request 成功时返回 data 字段', async () => {
    fetchMock.mockResolvedValue(createJsonResponse({
      code: 'OK',
      data: [{ hash: VALID_HASH }]
    }))

    const data = await client.listTransfers()
    expect(data).toEqual([{ hash: VALID_HASH }])
    expect(fetchMock).toHaveBeenCalledWith(
      'http://10.0.0.2:19090/api/v1/transfers',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer secret-token'
        })
      })
    )
  })

  it('request 在 HTTP 非 2xx 时抛出错误', async () => {
    fetchMock.mockResolvedValue(createJsonResponse({
      code: 'ERR',
      message: 'bad gateway'
    }, { ok: false, status: 502 }))

    await expect(client.listTransfers()).rejects.toThrow('bad gateway')
  })

  it('request 在响应体 code 非 OK 时抛出错误', async () => {
    fetchMock.mockResolvedValue(createJsonResponse({
      code: 'INVALID_QUERY',
      message: 'query required'
    }))

    await expect(client.startSearch({ query: '' })).rejects.toThrow('query required')
  })

  it('request 在 JSON 解析失败时使用 BAD_RESPONSE', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new Error('Unexpected token'))
    })

    await expect(client.listTransfers()).rejects.toThrow('Unexpected token')
  })

  it('addEd2k 提交 ed2k 链接', async () => {
    fetchMock.mockResolvedValue(createJsonResponse({ code: 'OK', data: { hash: VALID_HASH } }))
    const ed2k = 'ed2k://|file|a.mkv|1|ABCDEF0123456789ABCDEF0123456789|/'

    await client.addEd2k(ed2k)

    expect(fetchMock).toHaveBeenCalledWith(
      'http://10.0.0.2:19090/api/v1/transfers',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ed2k_link: ed2k })
      })
    )
  })

  it('pauseTransfer / resumeTransfer / removeTransfer 调用对应端点', async () => {
    fetchMock.mockResolvedValue(createJsonResponse({ code: 'OK', data: null }))

    await client.pauseTransfer(VALID_HASH)
    await client.resumeTransfer(VALID_HASH)
    await client.removeTransfer(VALID_HASH)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `http://10.0.0.2:19090/api/v1/transfers/${VALID_HASH}/pause`,
      expect.objectContaining({ method: 'POST' })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `http://10.0.0.2:19090/api/v1/transfers/${VALID_HASH}/resume`,
      expect.objectContaining({ method: 'POST' })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `http://10.0.0.2:19090/api/v1/transfers/${VALID_HASH}`,
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('startSearch 填充默认查询参数', async () => {
    fetchMock.mockResolvedValue(createJsonResponse({ code: 'OK', data: { state: 'RUNNING' } }))

    await client.startSearch({ query: 'movie' })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://10.0.0.2:19090/api/v1/searches',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          query: 'movie',
          scope: 'all',
          min_size: 0,
          max_size: 0,
          min_sources: 0,
          min_complete_sources: 0,
          file_type: '',
          extension: ''
        })
      })
    )
  })

  it('getCurrentSearch 与 stopSearch 调用正确路径', async () => {
    fetchMock.mockResolvedValue(createJsonResponse({ code: 'OK', data: null }))

    await client.getCurrentSearch()
    await client.stopSearch()

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://10.0.0.2:19090/api/v1/searches/current',
      expect.objectContaining({ method: 'GET' })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://10.0.0.2:19090/api/v1/searches/current/stop',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('downloadSearchResult 编码 hash 并传递可选字段', async () => {
    fetchMock.mockResolvedValue(createJsonResponse({ code: 'OK', data: { ok: true } }))
    const hashWithSlash = 'ab/cd'

    await client.downloadSearchResult(hashWithSlash, {
      target_dir: '/downloads',
      target_name: 'movie.mkv',
      paused: true
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `http://10.0.0.2:19090/api/v1/searches/current/results/${encodeURIComponent(hashWithSlash)}/download`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          target_dir: '/downloads',
          target_name: 'movie.mkv',
          paused: true
        })
      })
    )
  })

  it('getNetworkDht 请求网络 DHT 状态', async () => {
    fetchMock.mockResolvedValue(createJsonResponse({
      code: 'OK',
      data: { enabled: true }
    }))

    const data = await client.getNetworkDht()
    expect(data).toEqual({ enabled: true })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://10.0.0.2:19090/api/v1/network/dht',
      expect.objectContaining({ method: 'GET' })
    )
  })
})
