import { afterEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import { MAX_BT_TRACKER_LENGTH, PROXY_SCOPES } from '@shared/constants'
import {
  convertToAxiosProxy,
  convertTrackerDataToComma,
  convertTrackerDataToLine,
  fetchBtTrackerFromSource,
  reduceTrackerString
} from '@shared/utils/tracker'

vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}))

describe('convertToAxiosProxy', () => {
  it('空字符串返回 undefined', () => {
    expect(convertToAxiosProxy('')).toBeUndefined()
    expect(convertToAxiosProxy()).toBeUndefined()
  })

  it('解析无认证的 http 代理', () => {
    expect(convertToAxiosProxy('http://127.0.0.1:7890')).toEqual({
      protocol: 'http',
      host: '127.0.0.1',
      port: '7890'
    })
  })

  it('解析带用户名密码的代理', () => {
    expect(convertToAxiosProxy('http://user:pass@proxy.example.com:8080')).toEqual({
      protocol: 'http',
      host: 'proxy.example.com',
      port: '8080',
      auth: {
        username: 'user',
        password: 'pass'
      }
    })
  })
})

describe('convertTrackerDataToLine / convertTrackerDataToComma', () => {
  it('将数组合并为换行分隔的 tracker 列表', () => {
    const input = ['udp://a.com:80', 'udp://b.com:80']
    const result = convertTrackerDataToLine(input)
    expect(result).toContain('udp://a.com:80')
    expect(result).toContain('udp://b.com:80')
  })

  it('去除空行并转为逗号分隔', () => {
    const input = ['udp://a.com:80', '', 'udp://b.com:80']
    expect(convertTrackerDataToComma(input)).toBe('udp://a.com:80,udp://b.com:80')
  })
})

describe('reduceTrackerString', () => {
  it('未超长时原样返回', () => {
    const short = 'udp://a.com:80,udp://b.com:80'
    expect(reduceTrackerString(short)).toBe(short)
  })

  it('超长时在最后一个逗号处截断', () => {
    const partA = 'a'.repeat(MAX_BT_TRACKER_LENGTH - 10)
    const partB = 'b'.repeat(20)
    const long = `${partA},${partB}`
    const result = reduceTrackerString(long)
    expect(result.length).toBeLessThanOrEqual(MAX_BT_TRACKER_LENGTH)
    expect(result).toBe(partA)
  })

  it('无逗号时直接截断到最大长度', () => {
    const long = 'x'.repeat(MAX_BT_TRACKER_LENGTH + 10)
    expect(reduceTrackerString(long)).toBe('x'.repeat(MAX_BT_TRACKER_LENGTH))
  })
})

describe('fetchBtTrackerFromSource', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('空源返回空数组', async () => {
    await expect(fetchBtTrackerFromSource([])).resolves.toEqual([])
    await expect(fetchBtTrackerFromSource(null)).resolves.toEqual([])
  })

  it('并发拉取并去重 tracker 数据', async () => {
    axios.get
      .mockResolvedValueOnce({ data: 'udp://a.com:80' })
      .mockResolvedValueOnce({ data: 'udp://a.com:80' })

    const rows = await fetchBtTrackerFromSource(['https://source-a', 'https://source-b'])
    expect(rows).toEqual(['udp://a.com:80'])
    expect(axios.get).toHaveBeenCalledTimes(2)
  })

  it('在启用 update-trackers 代理时传入 proxy 配置', async () => {
    axios.get.mockResolvedValue({ data: 'udp://proxy.com:80' })

    await fetchBtTrackerFromSource(['https://source-a'], {
      enable: true,
      server: 'http://127.0.0.1:7890',
      scope: [PROXY_SCOPES.UPDATE_TRACKERS]
    })

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/source-a\?t=\d+$/),
      expect.objectContaining({
        proxy: {
          protocol: 'http',
          host: '127.0.0.1',
          port: '7890'
        }
      })
    )
  })
})
