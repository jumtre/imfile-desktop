import { beforeEach, describe, expect, it, vi } from 'vitest'

import { APP_THEME } from '@shared/constants'

const apiMock = vi.hoisted(() => ({
  savePreference: vi.fn(() => Promise.resolve({ ok: true })),
  fetchPreference: vi.fn(() => Promise.resolve({ theme: APP_THEME.DARK }))
}))

vi.mock('@/api', () => ({
  default: apiMock
}))

vi.mock('@shared/utils/tracker', () => ({
  fetchBtTrackerFromSource: vi.fn(() => Promise.resolve(['udp://tracker.example.com']))
}))

const { default: preferenceModule } = await import('@/store/modules/preference')

describe('store/modules/preference', () => {
  let state

  beforeEach(() => {
    state = {
      engineMode: 'MAX',
      config: {
        theme: APP_THEME.LIGHT,
        locale: 'zh-CN',
        historyDirectories: ['/downloads'],
        favoriteDirectories: [],
        proxy: { enable: false }
      }
    }
    vi.clearAllMocks()
  })

  describe('getters', () => {
    it('返回主题、语言与文字方向', () => {
      expect(preferenceModule.getters.theme(state)).toBe(APP_THEME.LIGHT)
      expect(preferenceModule.getters.locale(state)).toBe('zh-CN')
      expect(preferenceModule.getters.direction(state)).toBe('ltr')
    })
  })

  describe('actions', () => {
    it('updatePreference 合并配置', () => {
      const commit = vi.fn()
      preferenceModule.actions.updatePreference({ commit }, { theme: APP_THEME.DARK })
      expect(commit).toHaveBeenCalledWith('UPDATE_PREFERENCE_DATA', { theme: APP_THEME.DARK })
    })

    it('save 空配置时直接 resolve', async () => {
      const dispatch = vi.fn()
      await preferenceModule.actions.save({ dispatch }, {})
      expect(apiMock.savePreference).not.toHaveBeenCalled()
      expect(dispatch).toHaveBeenCalledWith('task/saveSession', null, { root: true })
    })

    it('recordHistoryDirectory 跳过已存在目录', () => {
      const dispatch = vi.fn()
      preferenceModule.actions.recordHistoryDirectory(
        { state, dispatch },
        '/downloads'
      )
      expect(dispatch).not.toHaveBeenCalled()
    })

    it('addHistoryDirectory 追加并保存', () => {
      const dispatch = vi.fn()
      preferenceModule.actions.addHistoryDirectory(
        { state, dispatch },
        '/new/path'
      )
      expect(dispatch).toHaveBeenCalledWith('save', {
        historyDirectories: ['/downloads', '/new/path']
      })
    })

    it('fetchBtTracker 调用 tracker 工具', async () => {
      const { fetchBtTrackerFromSource } = await import('@shared/utils/tracker')
      const rows = await preferenceModule.actions.fetchBtTracker(null, ['https://source'])
      expect(fetchBtTrackerFromSource).toHaveBeenCalledWith(
        ['https://source'],
        { enable: false }
      )
      expect(rows).toEqual(['udp://tracker.example.com'])
    })
  })
})
