import { describe, expect, it } from 'vitest'

import Deferred from '@shared/aria2/lib/Deferred'

describe('Deferred', () => {
  it('resolve 时 promise 完成', async () => {
    const deferred = new Deferred()
    deferred.resolve('ok')
    await expect(deferred.promise).resolves.toBe('ok')
  })

  it('reject 时 promise 拒绝', async () => {
    const deferred = new Deferred()
    const err = new Error('fail')
    deferred.reject(err)
    await expect(deferred.promise).rejects.toBe(err)
  })
})
