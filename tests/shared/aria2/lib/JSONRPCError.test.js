import { describe, expect, it } from 'vitest'

import { JSONRPCError } from '@shared/aria2/lib/JSONRPCError'

describe('JSONRPCError', () => {
  it('保留 code、message 与 data', () => {
    const err = new JSONRPCError({
      message: 'method not found',
      code: -32601,
      data: { method: 'aria2.foo' }
    })

    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('JSONRPCError')
    expect(err.message).toBe('method not found')
    expect(err.code).toBe(-32601)
    expect(err.data).toEqual({ method: 'aria2.foo' })
  })

  it('无 data 时不设置 data 字段', () => {
    const err = new JSONRPCError({ message: 'error', code: 1 })
    expect(err.data).toBeUndefined()
  })
})
