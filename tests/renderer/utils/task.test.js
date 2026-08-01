import { describe, expect, it } from 'vitest'

import { ADD_TASK_TYPE } from '@shared/constants'
import {
  buildOption,
  buildUriPayload,
  initTaskForm
} from '@/utils/task'
import { createTestStore } from '../../helpers/vue-test-helpers.js'

describe('renderer/utils/task', () => {
  it('initTaskForm 包含分片数默认值', () => {
    const store = createTestStore()
    const form = initTaskForm(store.state)

    expect(form.split).toBe(16)
    expect(form.engineMaxConnectionPerServer).toBe(64)
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
})
