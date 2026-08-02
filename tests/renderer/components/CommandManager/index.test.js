import { describe, expect, it, vi } from 'vitest'

import CommandManager from '@/components/CommandManager/index.js'

describe('CommandManager', () => {
  it('注册并执行命令', () => {
    const manager = new CommandManager()
    const handler = vi.fn(() => 'done')

    manager.register('test-cmd', handler)
    expect(manager.execute('test-cmd', 1, 2)).toBe('done')
    expect(handler).toHaveBeenCalledWith(1, 2)
  })

  it('重复注册返回 null', () => {
    const manager = new CommandManager()
    manager.register('dup', vi.fn())
    expect(manager.register('dup', vi.fn())).toBeNull()
  })

  it('缺少 id 或函数时不注册', () => {
    const manager = new CommandManager()
    expect(manager.register('', vi.fn())).toBeNull()
    expect(manager.register('no-fn')).toBeNull()
  })

  it('注销后 execute 返回 false', () => {
    const manager = new CommandManager()
    manager.register('temp', vi.fn())
    manager.unregister('temp')
    expect(manager.execute('temp')).toBe(false)
  })

  it('注册与注销时发出事件', () => {
    const manager = new CommandManager()
    const registered = vi.fn()
    const unregistered = vi.fn()

    manager.on('commandRegistered', registered)
    manager.on('commandUnregistered', unregistered)
    manager.register('evt', vi.fn())
    manager.unregister('evt')

    expect(registered).toHaveBeenCalledWith('evt')
    expect(unregistered).toHaveBeenCalledWith('evt')
  })
})
