import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ADD_TASK_TYPE, POST_DOWNLOAD_ACTION } from '@shared/constants'
import {
  createTestI18n,
  createTestStore,
  elementPlusStubs
} from '../../../helpers/vue-test-helpers.js'

const { default: TaskStateAction } = await import('@/components/Task/TaskStateAction.vue')

describe('TaskStateAction', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mountTaskStateAction = (overrides = {}) => {
    const store = createTestStore(overrides)
    return {
      store,
      wrapper: shallowMount(TaskStateAction, {
        global: {
          plugins: [store, createTestI18n()],
          stubs: {
            ...elementPlusStubs,
            'mo-icon': true,
            'mo-batch-delete-task-btn': true,
            ArrowDown: true
          }
        }
      })
    }
  }

  it('点击新建任务时打开添加对话框', () => {
    const { wrapper, store } = mountTaskStateAction()
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    wrapper.vm.onNewTaskClick()
    expect(dispatchSpy).toHaveBeenCalledWith('app/showAddTaskDialog', ADD_TASK_TYPE.URI)
  })

  it('设置下载完成后动作为关机', () => {
    const { wrapper, store } = mountTaskStateAction()
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    wrapper.vm.onPostDownloadActionCommand(POST_DOWNLOAD_ACTION.SHUTDOWN)
    expect(dispatchSpy).toHaveBeenCalledWith('task/setOnCompleteAction', POST_DOWNLOAD_ACTION.SHUTDOWN)
  })

  it('根据 store 显示当前下载完成后动作标签', () => {
    const { wrapper } = mountTaskStateAction({
      taskState: { onCompleteAction: POST_DOWNLOAD_ACTION.QUIT }
    })
    expect(wrapper.vm.postDownloadActionButtonLabel).toBe('退出应用')
  })

  it('多选任务时显示批量删除按钮', () => {
    const { wrapper } = mountTaskStateAction({
      taskState: {
        selectedTaskKeyList: ['aria2:a', 'aria2:b'],
        currentList: 'active'
      }
    })
    expect(wrapper.vm.selectedTaskKeyListCount).toBe(2)
    expect(wrapper.find('mo-batch-delete-task-btn-stub').exists()).toBe(true)
  })

  it('刷新时触发 fetchList', () => {
    const { wrapper, store } = mountTaskStateAction()
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    wrapper.vm.onRefreshClick()
    expect(dispatchSpy).toHaveBeenCalledWith('task/fetchList')
    expect(wrapper.vm.refreshing).toBe(true)
  })
})
