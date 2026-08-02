import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TASK_STATUS } from '@shared/constants'
import {
  createTestI18n,
  createTestStore,
  elementPlusStubs
} from '../../../helpers/vue-test-helpers.js'

const commandsEmit = vi.hoisted(() => vi.fn())

vi.mock('electron-is', () => ({
  default: {
    renderer: () => true,
    mas: () => false
  }
}))

vi.mock('@/utils/native', () => ({
  getTaskFullPath: vi.fn(() => '/downloads/demo.zip')
}))

vi.mock('@/components/CommandManager/instance', () => ({
  commands: { emit: commandsEmit }
}))

const { default: TaskItemActions } = await import('@/components/Task/TaskItemActions.vue')

const baseTask = {
  taskKey: 'aria2:gid-1',
  gid: 'gid-1',
  status: TASK_STATUS.ACTIVE,
  files: [{ uris: [{ uri: 'https://example.com/file.zip' }] }]
}

describe('TaskItemActions', () => {
  beforeEach(() => {
    commandsEmit.mockClear()
  })

  const mountActions = (task = baseTask) => {
    const store = createTestStore()
    return shallowMount(TaskItemActions, {
      props: { task, mode: 'LIST' },
      global: {
        plugins: [store, createTestI18n()],
        stubs: {
          ...elementPlusStubs,
          'mo-icon': true
        }
      }
    })
  }

  it('下载中任务显示暂停与删除操作', () => {
    const wrapper = mountActions()
    expect(wrapper.vm.taskActions).toEqual(
      expect.arrayContaining(['PAUSE', 'DELETE', 'FOLDER', 'LINK', 'INFO', 'EDIT_LINK'])
    )
  })

  it('已完成任务显示重启与回收站操作', () => {
    const wrapper = mountActions({
      ...baseTask,
      status: TASK_STATUS.COMPLETE
    })
    expect(wrapper.vm.taskActions).toEqual(
      expect.arrayContaining(['RESTART', 'TRASH'])
    )
  })

  it('点击暂停时发出 pause-task 命令', () => {
    const wrapper = mountActions()
    wrapper.vm.onPauseClick()
    expect(commandsEmit).toHaveBeenCalledWith('pause-task', expect.objectContaining({
      task: expect.objectContaining({ gid: 'gid-1' })
    }))
  })

  it('Shift+删除时携带 deleteWithFiles', () => {
    const wrapper = mountActions()
    wrapper.vm.onDeleteClick({ shiftKey: true })
    expect(commandsEmit).toHaveBeenCalledWith('delete-task', expect.objectContaining({
      deleteWithFiles: true
    }))
  })

  it('做种任务点击停止时发出 stop-task-seeding', () => {
    const wrapper = mountActions({
      ...baseTask,
      status: TASK_STATUS.ACTIVE,
      bittorrent: {},
      seeder: 'true'
    })
    wrapper.vm.onStopClick()
    expect(commandsEmit).toHaveBeenCalledWith('stop-task-seeding', expect.objectContaining({
      task: expect.objectContaining({ seeder: 'true' })
    }))
  })

  it('Alt+重启已完成任务时显示确认对话框', () => {
    const wrapper = mountActions({
      ...baseTask,
      status: TASK_STATUS.COMPLETE
    })
    wrapper.vm.onRestartClick({ altKey: true })
    expect(commandsEmit).toHaveBeenCalledWith('restart-task', expect.objectContaining({
      showDialog: true
    }))
  })
})
