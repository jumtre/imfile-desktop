import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'

import promiseEvent from '@shared/aria2/lib/promiseEvent'

describe('promiseEvent', () => {
  it('在目标事件触发时 resolve', async () => {
    const emitter = new EventEmitter()
    const pending = promiseEvent(emitter, 'open')
    emitter.emit('open', { ready: true })
    await expect(pending).resolves.toEqual({ ready: true })
  })

  it('在 error 事件时 reject', async () => {
    const emitter = new EventEmitter()
    const pending = promiseEvent(emitter, 'open')
    const err = new Error('socket error')
    emitter.emit('error', err)
    await expect(pending).rejects.toBe(err)
  })
})
