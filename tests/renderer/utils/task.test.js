import { describe, expect, it } from 'vitest'

import { ADD_TASK_TYPE } from '@shared/constants'
import {
  buildOption,
  buildTorrentPayload,
  buildUriPayload,
  clampTaskSplit,
  initTaskForm,
  resolveTaskSplit
} from '@/utils/task'
import { createTestStore } from '../../helpers/vue-test-helpers.js'

describe('renderer/utils/task', () => {
  it('initTaskForm 包含分片数默认值', () => {
    const store = createTestStore()
    const form = initTaskForm(store.state)

    expect(form.split).toBe(16)
    expect(form.engineMaxConnectionPerServer).toBe(64)
  })

  it('resolveTaskSplit 将系统 split 限制在 maxConnectionPerServer 内', () => {
    expect(resolveTaskSplit({
      split: 64,
      maxConnectionPerServer: 8,
      engineMaxConnectionPerServer: 64
    })).toBe(8)
  })

  it('resolveTaskSplit 在无 maxConnectionPerServer 时使用 split', () => {
    expect(resolveTaskSplit({
      split: 32,
      maxConnectionPerServer: 0,
      engineMaxConnectionPerServer: 64
    })).toBe(32)
  })

  it('clampTaskSplit 允许显式覆盖高于偏好上限的值', () => {
    expect(clampTaskSplit(32, 64)).toBe(32)
    expect(clampTaskSplit(0, 64)).toBe(1)
    expect(clampTaskSplit(128, 64)).toBe(64)
  })

  it('initTaskForm 保留 addTaskOptions 中的显式分片数', () => {
    const store = createTestStore({
      appState: {
        addTaskOptions: { split: 2 }
      }
    })
    const form = initTaskForm(store.state)

    expect(form.split).toBe(2)
  })

  it('buildOption 在 split > 0 时写入 split', () => {
    const options = buildOption(ADD_TASK_TYPE.URI, {
      allProxy: '',
      dir: '/downloads',
      out: '',
      selectFile: '',
      split: 2
    })

    expect(options.split).toBe(2)
  })

  it('buildOption 在 split 未设置时不写入 split', () => {
    const options = buildOption(ADD_TASK_TYPE.URI, {
      allProxy: '',
      dir: '/downloads',
      out: '',
      selectFile: '',
      split: 0
    })

    expect(options.split).toBeUndefined()
  })

  it('buildUriPayload 携带自定义分片数', () => {
    const payload = buildUriPayload({
      uris: 'https://example.com/file.zip',
      out: '',
      allProxy: '',
      dir: '/downloads',
      selectFile: '',
      split: 1,
      userAgent: '',
      referer: '',
      cookie: '',
      authorization: ''
    })

    expect(payload.options.split).toBe(1)
  })

  it('buildTorrentPayload 携带自定义分片数', () => {
    const payload = buildTorrentPayload({
      torrent: 'base64-torrent',
      allProxy: '',
      dir: '/downloads',
      out: '',
      selectFile: '',
      split: 2,
      userAgent: '',
      referer: '',
      cookie: '',
      authorization: ''
    })

    expect(payload.options.split).toBe(2)
  })
})
