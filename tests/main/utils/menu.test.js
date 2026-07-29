import { describe, expect, it } from 'vitest'

import {
  concat,
  flattenMenuItems,
  merge,
  translateTemplate,
  updateStates
} from '../../../src/main/utils/menu.js'

describe('main/utils/menu concat', () => {
  it('按 position 插入子菜单项', () => {
    const template = [{ id: 'a' }, { id: 'b' }]
    const submenu = [{ id: 'x' }]
    concat(template, submenu, [{ id: 'first', position: 'first' }])
    expect(submenu.map((item) => item.id)).toEqual(['first', 'x'])
  })

  it('在 relative-id 之后插入', () => {
    const template = [{ id: 'a' }, { id: 'b' }]
    concat(template, template, [{ id: 'after-b', position: 'after', 'relative-id': 'b' }])
    expect(template.map((item) => item.id)).toEqual(['a', 'b', 'after-b'])
  })
})

describe('main/utils/menu merge', () => {
  it('合并已有 id 的子菜单', () => {
    const template = [{ id: 'root', submenu: [{ id: 'child' }] }]
    merge(template, { id: 'root', submenu: [{ id: 'new-child' }] })
    expect(template[0].submenu.map((item) => item.id)).toEqual(['child', 'new-child'])
  })

  it('追加未知 id 的顶层项', () => {
    const template = []
    merge(template, { id: 'new-root', label: 'New' })
    expect(template).toHaveLength(1)
    expect(template[0].id).toBe('new-root')
  })
})

describe('main/utils/menu translateTemplate', () => {
  it('翻译 label 并绑定快捷键', () => {
    const template = [{ id: 'preferences', label: 'menu.preferences', command: 'application:preferences' }]
    const i18n = { t: (key) => `translated:${key}` }
    const keystrokes = { 'application:preferences': 'Cmd+,' }
    translateTemplate(template, keystrokes, i18n)
    expect(template[0].label).toBe('translated:menu.preferences')
    expect(template[0].accelerator).toBeTruthy()
    expect(typeof template[0].click).toBe('function')
  })
})

describe('main/utils/menu flattenMenuItems', () => {
  it('扁平化 Electron Menu 结构', () => {
    const menu = {
      items: [
        { id: 'a' },
        { id: 'b', submenu: { items: [{ id: 'b-1' }] } }
      ]
    }
    const flat = flattenMenuItems(menu)
    expect(Object.keys(flat)).toEqual(['a', 'b', 'b-1'])
  })
})

describe('main/utils/menu updateStates', () => {
  it('更新菜单项可见、启用与勾选状态', () => {
    const items = {
      'task-list': { id: 'task-list', visible: true, enabled: true, checked: false }
    }
    updateStates(
      items,
      { 'task-list': false },
      { 'task-list': false },
      { 'task-list': true }
    )
    expect(items['task-list']).toMatchObject({
      visible: false,
      enabled: false,
      checked: true
    })
  })
})
