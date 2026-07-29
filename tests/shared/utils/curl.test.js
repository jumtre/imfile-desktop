import { describe, expect, it } from 'vitest'

import {
  buildDefaultOptionsFromCurl,
  buildHeadersFromCurl,
  buildUrisFromCurl
} from '@shared/utils/curl'

describe('curl utils', () => {
  it('从 curl 命令解析 URL', () => {
    const uris = buildUrisFromCurl([
      "curl 'https://example.com/file.zip?token=abc'"
    ])
    expect(uris[0]).toBe('https://example.com/file.zip?token=abc')
  })

  it('非 curl 输入原样返回', () => {
    expect(buildUrisFromCurl(['https://plain.url'])).toEqual(['https://plain.url'])
  })

  it('从 curl 命令解析请求头', () => {
    const headers = buildHeadersFromCurl([
      "curl 'https://example.com' -H 'User-Agent: test-agent' -H 'Referer: https://ref.com'"
    ])
    expect(headers[0]).toMatchObject({
      'User-Agent': 'test-agent',
      Referer: 'https://ref.com'
    })
  })

  it('将 curl 头合并到表单默认选项', () => {
    const form = {}
    const headers = [{ cookie: 'a=1', referer: 'https://r.com', 'user-agent': 'ua' }]
    buildDefaultOptionsFromCurl(form, headers)
    expect(form).toEqual({
      cookie: 'a=1',
      referer: 'https://r.com',
      userAgent: 'ua'
    })
  })

  it('已有表单字段不被 curl 头覆盖', () => {
    const form = { cookie: 'keep=1' }
    buildDefaultOptionsFromCurl(form, [{ cookie: 'new=1' }])
    expect(form.cookie).toBe('keep=1')
  })
})
