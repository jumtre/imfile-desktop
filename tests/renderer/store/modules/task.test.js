import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST_DOWNLOAD_ACTION, TASK_STATUS } from '@shared/constants'

const ipcSend = vi.hoisted(() => vi.fn())
const apiMock = vi.hoisted(() => ({
  pauseTaskByEngine: vi.fn(() => Promise.resolve()),
  resumeTaskByEngine: vi.fn(() => Promise.resolve()),
  batchResumeTask: vi.fn(() => Promise.resolve()),
  batchPauseTask: vi.fn(() => Promise.resolve()),
  fetchTaskList: vi.fn(() => Promise.resolve([])),
  getGoed2kdStatus: vi.fn(() => Promise.resolve({ healthy: false }))
}))

vi.mock('electron', () => ({
  ipcRenderer: {
    send: ipcSend,
    invoke: vi.fn()
  }
}))

vi.mock('@/api', () => ({
  default: apiMock
}))

const { default: taskModule } = await import('@/store/modules/task')

const baseTask = {
  taskKey: 'goed2kd:hash1',
  engine: 'goed2kd',
  gid: 'hash1',
  status: TASK_STATUS.ACTIVE
}

describe('store/modules/task', () => {
  let state

  beforeEach(() => {
    state = {
      ...taskModule.state,
      taskList: [
        { taskKey: 'aria2:g1', gid: 'g1' },
        { taskKey: 'aria2:g2', gid: 'g2' }
      ],
      selectedTaskKeyList: ['aria2:g1'],
      taskStatusSnapshot: {}
    }
    vi.clearAllMocks()
  })

  describe('actions', () => {
    it('setOnCompleteAction 写入状态', () => {
      const commit = vi.fn()
      taskModule.actions.setOnCompleteAction(
        { commit },
        POST_DOWNLOAD_ACTION.SHUTDOWN
      )
      expect(commit).toHaveBeenCalledWith('SET_ON_COMPLETE_ACTION', POST_DOWNLOAD_ACTION.SHUTDOWN)
    })

    it('selectTasks 与 selectAllTask 更新选中列表', () => {
      const commit = vi.fn()
      taskModule.actions.selectTasks({ commit }, ['aria2:g2'])
      expect(commit).toHaveBeenCalledWith('UPDATE_SELECTED_TASK_KEY_LIST', ['aria2:g2'])

      taskModule.actions.selectAllTask({ commit, state })
      expect(commit).toHaveBeenCalledWith('UPDATE_SELECTED_TASK_KEY_LIST', ['aria2:g1', 'aria2:g2'])
    })

    it('toggleTask 对 active 任务调用 pauseTask', () => {
      const dispatch = vi.fn()
      const task = { status: TASK_STATUS.ACTIVE, gid: 'g1' }
      taskModule.actions.toggleTask({ dispatch }, task)
      expect(dispatch).toHaveBeenCalledWith('pauseTask', task)
    })

    it('toggleTask 对 paused 任务调用 resumeTask', () => {
      const dispatch = vi.fn()
      const task = { status: TASK_STATUS.PAUSED, gid: 'g1' }
      taskModule.actions.toggleTask({ dispatch }, task)
      expect(dispatch).toHaveBeenCalledWith('resumeTask', task)
    })

    it('detectGoed2kdCompletedTasks 检测新完成任务', () => {
      const commit = vi.fn()
      const dispatch = vi.fn()
      const completedTask = {
        ...baseTask,
        status: TASK_STATUS.COMPLETE
      }

      state.taskStatusSnapshot = { 'goed2kd:hash1': TASK_STATUS.ACTIVE }
      taskModule.actions.detectGoed2kdCompletedTasks(
        { state, commit, dispatch },
        [completedTask]
      )

      expect(dispatch).toHaveBeenCalledWith('emitDownloadCompleteEvent', {
        task: completedTask,
        isBT: false
      })
      expect(commit).toHaveBeenCalledWith(
        'UPDATE_TASK_STATUS_SNAPSHOT',
        expect.objectContaining({ 'goed2kd:hash1': TASK_STATUS.COMPLETE })
      )
    })

    it('cancelPostDownloadConfirm 重置确认状态与动作', () => {
      const commit = vi.fn()
      taskModule.actions.cancelPostDownloadConfirm({ commit })
      expect(commit).toHaveBeenCalledWith('SET_POST_DOWNLOAD_AWAITING_CONFIRM', false)
      expect(commit).toHaveBeenCalledWith('SET_ON_COMPLETE_ACTION', POST_DOWNLOAD_ACTION.NONE)
    })

    it('batchResumeSelectedTasks 仅处理 aria2 任务', async () => {
      state.selectedTaskKeyList = ['aria2:g1', 'goed2kd:hash1']
      await taskModule.actions.batchResumeSelectedTasks({ state })
      expect(apiMock.batchResumeTask).toHaveBeenCalledWith({ gids: ['g1'] })
    })

    it('hideTaskDetail 关闭详情面板', () => {
      const commit = vi.fn()
      taskModule.actions.hideTaskDetail({ commit })
      expect(commit).toHaveBeenCalledWith('CHANGE_TASK_DETAIL_VISIBLE', false)
    })

    it('emitDownloadCompleteEvent 发送 IPC 事件', () => {
      const task = {
        gid: 'g1',
        files: [{ path: '/downloads/a.zip' }]
      }
      taskModule.actions.emitDownloadCompleteEvent({}, { task, isBT: true })
      expect(ipcSend).toHaveBeenCalledWith(
        'event',
        'task-download-complete',
        task,
        expect.any(String),
        true
      )
    })
  })
})
