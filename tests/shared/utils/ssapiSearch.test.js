import { describe, expect, it } from 'vitest'

import {
  buildMagnetFromInfoHash,
  buildSsapiSearchUrl,
  getSsapiRowMagnet,
  isValidSsapiBaseUrlOptional,
  mapSsapiSearchResponse,
  normalizeSsapiBaseUrl,
  normalizeSsapiSearchItem
} from '@shared/utils/ssapiSearch'

const VALID_HASH = '0123456789abcdef0123456789abcdef01234567'

describe('normalizeSsapiBaseUrl', () => {
  it('仅接受 https origin', () => {
    expect(normalizeSsapiBaseUrl('https://search.example.com/path?q=1')).toBe('https://search.example.com')
    expect(normalizeSsapiBaseUrl('http://search.example.com')).toBe('')
    expect(normalizeSsapiBaseUrl('not-a-url')).toBe('')
    expect(normalizeSsapiBaseUrl('')).toBe('')
    expect(normalizeSsapiBaseUrl(null)).toBe('')
  })
})

describe('buildSsapiSearchUrl', () => {
  it('拼接搜索 API 地址', () => {
    expect(buildSsapiSearchUrl('https://search.example.com')).toBe('https://search.example.com/v1/search')
    expect(buildSsapiSearchUrl('http://bad.example.com')).toBe('')
  })
})

describe('buildMagnetFromInfoHash', () => {
  it('根据 infoHash 生成磁力链接', () => {
    expect(buildMagnetFromInfoHash('movie.mkv', VALID_HASH)).toBe(
      `magnet:?xt=urn:btih:${VALID_HASH}&dn=${encodeURIComponent('movie.mkv')}`
    )
  })

  it('非法 hash 返回空字符串', () => {
    expect(buildMagnetFromInfoHash('movie.mkv', 'bad-hash')).toBe('')
    expect(buildMagnetFromInfoHash('movie.mkv', '')).toBe('')
  })
})

describe('normalizeSsapiSearchItem', () => {
  it('规范化顶层字段', () => {
    const row = normalizeSsapiSearchItem({
      title: 'Demo Movie',
      infoHash: VALID_HASH.toUpperCase(),
      size: 2048,
      seeders: 10,
      leechers: 2
    })

    expect(row).toMatchObject({
      hash: VALID_HASH,
      name: 'Demo Movie',
      sizeBytes: 2048,
      source: '10/2'
    })
    expect(row.magnetUri).toContain(`magnet:?xt=urn:btih:${VALID_HASH}`)
  })

  it('兼容 torrent 嵌套字段与 API 返回的 magnetUri', () => {
    const magnet = `magnet:?xt=urn:btih:${VALID_HASH}&dn=demo`
    const row = normalizeSsapiSearchItem({
      torrent: {
        info_hash: VALID_HASH,
        name: 'nested.mkv',
        size: 1024,
        seeders: 1,
        leechers: 0,
        magnet_uri: magnet
      }
    })

    expect(row).toMatchObject({
      name: 'nested.mkv',
      magnetUri: magnet
    })
  })

  it('缺少合法 hash 时返回 null', () => {
    expect(normalizeSsapiSearchItem({ title: 'x' })).toBeNull()
    expect(normalizeSsapiSearchItem(null)).toBeNull()
  })
})

describe('mapSsapiSearchResponse', () => {
  it('解析 data.items 形态', () => {
    const result = mapSsapiSearchResponse({
      data: {
        items: [{ infoHash: VALID_HASH, title: 'a' }],
        totalCount: 1,
        hasNextPage: false
      }
    })

    expect(result.rows).toHaveLength(1)
    expect(result.totalCount).toBe(1)
    expect(result.hasNextPage).toBe(false)
  })

  it('解析 torrentContent.search 嵌套形态', () => {
    const result = mapSsapiSearchResponse({
      data: {
        torrentContent: {
          search: {
            items: [{ info_hash: VALID_HASH, title: 'b' }],
            totalCount: 99,
            hasNextPage: true
          }
        }
      }
    })

    expect(result.rows).toHaveLength(1)
    expect(result.totalCount).toBe(99)
    expect(result.hasNextPage).toBe(true)
  })

  it('非法响应返回空结果', () => {
    expect(mapSsapiSearchResponse(null)).toEqual({
      rows: [],
      totalCount: null,
      hasNextPage: false
    })
  })
})

describe('getSsapiRowMagnet', () => {
  it('优先使用行内 magnetUri', () => {
    const magnet = `magnet:?xt=urn:btih:${VALID_HASH}`
    expect(getSsapiRowMagnet({ magnetUri: magnet, hash: VALID_HASH, name: 'x' })).toBe(magnet)
  })

  it('无有效 magnetUri 时回退拼装', () => {
    expect(getSsapiRowMagnet({ hash: VALID_HASH, name: 'demo.mkv' })).toContain(VALID_HASH)
    expect(getSsapiRowMagnet(null)).toBe('')
  })
})

describe('isValidSsapiBaseUrlOptional', () => {
  it('空值合法，非空须为 https origin', () => {
    expect(isValidSsapiBaseUrlOptional('')).toBe(true)
    expect(isValidSsapiBaseUrlOptional('   ')).toBe(true)
    expect(isValidSsapiBaseUrlOptional('https://search.example.com')).toBe(true)
    expect(isValidSsapiBaseUrlOptional('http://search.example.com')).toBe(false)
  })
})
