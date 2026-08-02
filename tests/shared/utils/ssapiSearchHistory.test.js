import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  addSsapiSearchHistoryItem,
  clearSsapiSearchHistory,
  loadSsapiSearchHistory,
  removeSsapiSearchHistoryItem
} from '@shared/utils/ssapiSearchHistory'
import { installLocalStorageMock } from '../../helpers/local-storage-mock.js'

describe('ssapiSearchHistory', () => {
  let storage

  beforeEach(() => {
    storage = installLocalStorageMock()
  })

  afterEach(() => {
    storage.clear()
  })

  it('初始为空列表', () => {
    expect(loadSsapiSearchHistory()).toEqual([])
  })

  it('新增搜索词并置顶', () => {
    addSsapiSearchHistoryItem('first')
    addSsapiSearchHistoryItem('second')

    expect(loadSsapiSearchHistory()).toEqual(['second', 'first'])
  })

  it('按不区分大小写去重', () => {
    addSsapiSearchHistoryItem('Torrent')
    addSsapiSearchHistoryItem('torrent')

    expect(loadSsapiSearchHistory()).toEqual(['torrent'])
  })

  it('忽略空白查询', () => {
    addSsapiSearchHistoryItem('  ')
    expect(loadSsapiSearchHistory()).toEqual([])
  })

  it('删除指定历史项', () => {
    addSsapiSearchHistoryItem('keep')
    addSsapiSearchHistoryItem('remove')
    removeSsapiSearchHistoryItem('REMOVE')

    expect(loadSsapiSearchHistory()).toEqual(['keep'])
  })

  it('清空历史', () => {
    addSsapiSearchHistoryItem('a')
    clearSsapiSearchHistory()
    expect(loadSsapiSearchHistory()).toEqual([])
  })

  it('非数组存储内容回退为空数组', () => {
    localStorage.setItem('imfile-ssapi-search-history', JSON.stringify({ bad: true }))
    expect(loadSsapiSearchHistory()).toEqual([])
  })

  it('超过 30 条时截断', () => {
    for (let i = 0; i < 35; i++) {
      addSsapiSearchHistoryItem(`q-${i}`)
    }
    expect(loadSsapiSearchHistory()).toHaveLength(30)
    expect(loadSsapiSearchHistory()[0]).toBe('q-34')
  })
})
