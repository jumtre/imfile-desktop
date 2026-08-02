import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ADD_TASK_TYPE } from '@shared/constants'
import {
  createTestI18n,
  createTestStore,
  elementPlusStubs
} from '../../../helpers/vue-test-helpers.js'

const commandsEmit = vi.hoisted(() => vi.fn())

vi.mock('@/components/CommandManager/instance', () => ({
  commands: { emit: commandsEmit }
}))

const { default: TaskActions } = await import('@/components/Task/TaskActions.vue')

describe('TaskActions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    commandsEmit.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mountTaskActions = () => {
    const store = createTestStore()
    return {
      store,
      wrapper: shallowMount(TaskActions, {
        global: {
          plugins: [store, createTestI18n()],
          stubs: {
            ...elementPlusStubs,
            'mo-icon': true
          }
        }
      })
    }
  }

  it('点击新建任务时打开 URI 添加对话框', () => {
    const { wrapper, store } = mountTaskActions()
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    wrapper.vm.onAddClick()
    expect(dispatchSpy).toHaveBeenCalledWith('app/showAddTaskDialog', ADD_TASK_TYPE.URI)
  })

  it('点击刷新时拉取列表并显示旋转动画', async () => {
    const { wrapper, store } = mountTaskActions()
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    wrapper.vm.onRefreshClick()
    expect(dispatchSpy).toHaveBeenCalledWith('task/fetchList')
    expect(wrapper.vm.refreshing).toBe(true)

    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.refreshing).toBe(false)
  })

  it('Shift+批量删除时携带 deleteWithFiles', () => {
    const { wrapper } = mountTaskActions()
    wrapper.vm.onBatchDeleteClick({ shiftKey: true })
    expect(commandsEmit).toHaveBeenCalledWith('batch-delete-task', {
      deleteWithFiles: true
    })
  })
})
