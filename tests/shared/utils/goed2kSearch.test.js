import { describe, expect, it } from 'vitest'

import {
  getSearchResultEd2kUri,
  isGoed2kSearchActive,
  mapSearchResultsFromDto,
  mergeSearchResultRows,
  normalizeSearchResult
} from '@shared/utils/goed2kSearch'

describe('normalizeSearchResult', () => {
  it('规范化 goed2kd 搜索结果字段', () => {
    const row = normalizeSearchResult({
      file_name: 'demo.mkv',
      size: 1024,
      hash: 'ABCDEF0123456789ABCDEF0123456789',
      sources: 5,
      ed2k_link: 'ed2k://|file|demo.mkv|1024|ABCDEF0123456789ABCDEF0123456789|/'
    })

    expect(row).toMatchObject({
      hash: 'abcdef0123456789abcdef0123456789',
      name: 'demo.mkv',
      sizeBytes: 1024,
      source: '5'
    })
    expect(row.ed2kLink).toContain('ed2k://')
  })

  it('缺少 hash 时返回 null', () => {
    expect(normalizeSearchResult({ name: 'x' })).toBeNull()
    expect(normalizeSearchResult(null)).toBeNull()
  })
})

describe('getSearchResultEd2kUri', () => {
  it('优先使用 API 返回的 ed2k 链接', () => {
    const uri = 'ed2k://|file|a.mkv|1|ABCDEF0123456789ABCDEF0123456789|/'
    expect(getSearchResultEd2kUri({ ed2kLink: uri, hash: 'abc' })).toBe(uri)
  })

  it('无链接时按标准格式拼装', () => {
    const uri = getSearchResultEd2kUri({
      hash: 'abcdef0123456789abcdef0123456789',
      name: 'movie.mkv',
      sizeBytes: 2048
    })
    expect(uri).toBe(
      'ed2k://|file|movie.mkv|2048|ABCDEF0123456789ABCDEF0123456789|/'
    )
  })
})

describe('mapSearchResultsFromDto', () => {
  it('从 DTO 映射并过滤无效项', () => {
    const rows = mapSearchResultsFromDto({
      results: [
        { hash: 'abc', file_name: 'a' },
        { file_name: 'no-hash' }
      ]
    })
    expect(rows).toHaveLength(1)
    expect(rows[0].hash).toBe('abc')
  })
})

describe('mergeSearchResultRows', () => {
  it('按 hash 合并并保留顺序', () => {
    const prev = [{ hash: 'a', name: 'old-a' }]
    const incoming = [
      { hash: 'a', name: 'new-a' },
      { hash: 'b', name: 'b' }
    ]
    const { rows, truncated } = mergeSearchResultRows(prev, incoming)
    expect(truncated).toBe(false)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ hash: 'a', name: 'new-a' })
    expect(rows[1]).toMatchObject({ hash: 'b' })
  })

  it('达到上限后截断新条目', () => {
    const prev = [{ hash: 'a', name: 'a' }]
    const incoming = [{ hash: 'b', name: 'b' }]
    const { rows, truncated } = mergeSearchResultRows(prev, incoming, 1)
    expect(truncated).toBe(true)
    expect(rows).toHaveLength(1)
    expect(rows[0].hash).toBe('a')
  })
})

describe('isGoed2kSearchActive', () => {
  it('识别搜索进行中的状态', () => {
    expect(isGoed2kSearchActive({ state: 'RUNNING' })).toBe(true)
    expect(isGoed2kSearchActive({ state: 'searching' })).toBe(true)
    expect(isGoed2kSearchActive({ state: 'DONE' })).toBe(false)
    expect(isGoed2kSearchActive({ error: 'failed' })).toBe(false)
    expect(isGoed2kSearchActive(null)).toBe(false)
  })
})
