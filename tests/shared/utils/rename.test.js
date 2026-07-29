import { describe, expect, it } from 'vitest'

import { buildOuts, buildRule, getRuleString } from '@shared/utils/rename'

describe('getRuleString', () => {
  it('从 out 模板提取括号内规则', () => {
    expect(getRuleString('file(01+1).txt')).toBe('01+1')
    expect(getRuleString('no-rule.txt')).toBeNull()
  })
})

describe('buildRule', () => {
  it('解析递增规则', () => {
    expect(buildRule('01+1')).toEqual({ init: 1, step: '1', len: 2 })
  })

  it('解析递减规则', () => {
    expect(buildRule('10-2')).toEqual({ init: 10, step: -2, len: 2 })
  })

  it('无运算符时使用默认值', () => {
    expect(buildRule('05')).toEqual({ init: 1, step: 1, len: 1 })
  })
})

describe('buildOuts', () => {
  it('单链接直接返回 out', () => {
    expect(buildOuts(['https://a.com/1'], 'out.txt')).toEqual(['out.txt'])
  })

  it('按规则批量生成 out 文件名', () => {
    const uris = ['https://a.com/1', 'https://a.com/2', 'https://a.com/3']
    expect(buildOuts(uris, 'file(01+1).txt')).toEqual([
      'file01.txt',
      'file02.txt',
      'file03.txt'
    ])
  })

  it('无规则或空输入返回空数组', () => {
    expect(buildOuts([], 'file(01+1).txt')).toEqual([])
    expect(buildOuts(['https://a.com'], '')).toEqual([])
    expect(buildOuts(['https://a.com/1', 'https://a.com/2'], 'plain.txt')).toEqual([])
  })
})
