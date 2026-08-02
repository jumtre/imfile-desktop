import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ADD_TASK_TYPE } from '@shared/constants'

vi.mock('@/utils/native', () => ({
  getSystemTheme: vi.fn(() => 'light')
}))

const apiMock = vi.hoisted(() => ({
  getVersion: vi.fn(() => Promise.resolve({ version: '1.0' })),
  getGlobalOption: vi.fn(() => Promise.resolve({ maxConnections: 16 })),
  getGlobalStat: vi.fn(() => Promise.resolve({
    downloadSpeed: '1024',
    uploadSpeed: '0',
    numActive: '2',
    numWaiting: '1',
    numStopped: '3'
  })),
  getGoed2kdStatus: vi.fn(() => Promise.resolve({ healthy: true })),
  fetchActiveTaskList: vi.fn(() => Promise.resolve([]))
}))

vi.mock('@/api', () => ({
  default: apiMock
}))

const { default: appModule } = await import('@/store/modules/app')

describe('store/modules/app', () => {
  let state

  beforeEach(() => {
    state = {
      ...appModule.state,
      interval: 1000,
      addTaskVisible: false,
      addTaskType: ADD_TASK_TYPE.URI,
      addTaskUrl: 'old',
      addTaskTorrents: [{ name: 'a.torrent' }],
      stat: { downloadSpeed: 0, uploadSpeed: 0, numActive: 0, numWaiting: 0, numStopped: 0 }
    }
    vi.clearAllMocks()
  })

  describe('mutations', () => {
    it('UPDATE_INTERVAL 限制在最小/最大范围内', () => {
      appModule.mutations.UPDATE_INTERVAL(state, 100)
      expect(state.interval).toBe(500)
      appModule.mutations.UPDATE_INTERVAL(state, 9000)
      expect(state.interval).toBe(6000)
    })

    it('UPDATE_ADD_TASK_VISIBLE 与 UPDATE_ADD_TASK_TYPE', () => {
      appModule.mutations.UPDATE_ADD_TASK_VISIBLE(state, true)
      appModule.mutations.UPDATE_ADD_TASK_TYPE(state, ADD_TASK_TYPE.TORRENT)
      expect(state.addTaskVisible).toBe(true)
      expect(state.addTaskType).toBe(ADD_TASK_TYPE.TORRENT)
    })
  })

  describe('actions', () => {
    it('showAddTaskDialog 设置类型并显示', () => {
      const commit = vi.fn()
      appModule.actions.showAddTaskDialog({ commit }, ADD_TASK_TYPE.TORRENT)
      expect(commit).toHaveBeenCalledWith('UPDATE_ADD_TASK_TYPE', ADD_TASK_TYPE.TORRENT)
      expect(commit).toHaveBeenCalledWith('UPDATE_ADD_TASK_VISIBLE', true)
    })

    it('hideAddTaskDialog 重置添加任务状态', () => {
      const commit = vi.fn()
      appModule.actions.hideAddTaskDialog({ commit })
      expect(commit).toHaveBeenCalledWith('UPDATE_ADD_TASK_VISIBLE', false)
      expect(commit).toHaveBeenCalledWith('UPDATE_ADD_TASK_URL', '')
      expect(commit).toHaveBeenCalledWith('UPDATE_ADD_TASK_TORRENTS', [])
    })

    it('fetchGlobalStat 有活动任务时缩短轮询间隔', async () => {
      const commit = vi.fn()
      const dispatch = vi.fn()
      await appModule.actions.fetchGlobalStat({ commit, dispatch })
      expect(commit).toHaveBeenCalledWith('UPDATE_GLOBAL_STAT', expect.objectContaining({
        numActive: 2,
        downloadSpeed: 1024
      }))
      expect(dispatch).toHaveBeenCalledWith('updateInterval', 800)
    })

    it('fetchEngineInfo 成功时更新引擎信息', async () => {
      const commit = vi.fn()
      await appModule.actions.fetchEngineInfo({ commit })
      expect(commit).toHaveBeenCalledWith('UPDATE_ENGINE_INFO', { version: '1.0' })
    })
  })
})
