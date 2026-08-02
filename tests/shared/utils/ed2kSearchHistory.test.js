import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  addEd2kSearchHistoryItem,
  clearEd2kSearchHistory,
  loadEd2kSearchHistory,
  removeEd2kSearchHistoryItem
} from '@shared/utils/ed2kSearchHistory'
import { installLocalStorageMock } from '../../helpers/local-storage-mock.js'

describe('ed2kSearchHistory', () => {
  let storage

  beforeEach(() => {
    storage = installLocalStorageMock()
  })

  afterEach(() => {
    storage.clear()
  })

  it('初始为空列表', () => {
    expect(loadEd2kSearchHistory()).toEqual([])
  })

  it('新增搜索词并置顶', () => {
    addEd2kSearchHistoryItem('first')
    addEd2kSearchHistoryItem('second')

    expect(loadEd2kSearchHistory()).toEqual(['second', 'first'])
  })

  it('按不区分大小写去重', () => {
    addEd2kSearchHistoryItem('Movie')
    addEd2kSearchHistoryItem('movie')

    expect(loadEd2kSearchHistory()).toEqual(['movie'])
  })

  it('忽略空白查询', () => {
    addEd2kSearchHistoryItem('  ')
    expect(loadEd2kSearchHistory()).toEqual([])
  })

  it('删除指定历史项', () => {
    addEd2kSearchHistoryItem('keep')
    addEd2kSearchHistoryItem('remove')
    removeEd2kSearchHistoryItem('REMOVE')

    expect(loadEd2kSearchHistory()).toEqual(['keep'])
  })

  it('清空历史', () => {
    addEd2kSearchHistoryItem('a')
    clearEd2kSearchHistory()
    expect(loadEd2kSearchHistory()).toEqual([])
  })

  it('损坏的 localStorage 数据回退为空数组', () => {
    localStorage.setItem('imfile-ed2k-search-history', '{bad-json')
    expect(loadEd2kSearchHistory()).toEqual([])
  })

  it('超过 30 条时截断', () => {
    for (let i = 0; i < 35; i++) {
      addEd2kSearchHistoryItem(`q-${i}`)
    }
    expect(loadEd2kSearchHistory()).toHaveLength(30)
    expect(loadEd2kSearchHistory()[0]).toBe('q-34')
  })
})
