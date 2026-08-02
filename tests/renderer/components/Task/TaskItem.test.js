import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { TASK_STATUS } from '@shared/constants'
import {
  createTestI18n,
  createTestStore,
  elementPlusStubs
} from '../../../helpers/vue-test-helpers.js'

vi.mock('@/utils/native', () => ({
  openItem: vi.fn(() => Promise.resolve('')),
  getTaskFullPath: vi.fn(() => '/downloads/demo.zip')
}))

vi.mock('@/components/Task/TaskItemActions', () => ({
  default: { name: 'mo-task-item-actions', template: '<div class="task-item-actions-stub" />' }
}))

const { default: TaskItem } = await import('@/components/Task/TaskItem.vue')

const baseTask = {
  taskKey: 'aria2:gid-1',
  gid: 'gid-1',
  status: TASK_STATUS.ACTIVE,
  totalLength: 1000,
  completedLength: 500,
  downloadSpeed: 1024,
  uploadSpeed: 0,
  connections: 8,
  files: [{ path: '/downloads/demo.zip' }]
}

describe('TaskItem', () => {
  const mountTaskItem = (task = baseTask, storeOverrides = {}) => {
    const store = createTestStore(storeOverrides)
    const msg = vi.fn()
    msg.info = vi.fn()
    msg.error = vi.fn()

    const wrapper = shallowMount(TaskItem, {
      props: { task },
      global: {
        plugins: [store, createTestI18n()],
        stubs: {
          ...elementPlusStubs,
          'mo-task-item-actions': true,
          'mo-icon': true
        },
        mocks: { $msg: msg }
      }
    })

    return { wrapper, store, msg }
  }

  it('展示任务名、连接数与速度', () => {
    const { wrapper } = mountTaskItem()
    expect(wrapper.text()).toContain('demo.zip')
    expect(wrapper.text()).toContain('8')
    expect(wrapper.text()).toContain('/s')
  })

  it('按进度设置行内 CSS 变量', () => {
    const { wrapper } = mountTaskItem()
    expect(wrapper.attributes('style')).toContain('--task-row-progress: 50%')
  })

  it('已完成任务进度为 100%', () => {
    const { wrapper } = mountTaskItem({
      ...baseTask,
      status: TASK_STATUS.COMPLETE,
      completedLength: 1000
    })
    expect(wrapper.vm.rowProgressPercent).toBe(100)
    expect(wrapper.attributes('style')).toContain('--task-row-progress: 100%')
  })

  it('双击已完成任务时打开文件', async () => {
    const { wrapper, msg } = mountTaskItem({
      ...baseTask,
      status: TASK_STATUS.COMPLETE,
      completedLength: 1000,
      bittorrent: { info: { name: 'archive.zip' } },
      files: [{ path: '/downloads/archive.zip' }]
    })

    await wrapper.vm.onDbClick()
    expect(msg.info).toHaveBeenCalled()
  })

  it('双击等待中任务时切换任务状态', () => {
    const { wrapper, store } = mountTaskItem({
      ...baseTask,
      status: TASK_STATUS.WAITING
    })
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    wrapper.vm.onDbClick()
    expect(dispatchSpy).toHaveBeenCalledWith('task/toggleTask', expect.objectContaining({
      status: TASK_STATUS.WAITING
    }))
  })
})
