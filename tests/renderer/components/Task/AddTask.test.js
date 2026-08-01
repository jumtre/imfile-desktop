import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ADD_TASK_TYPE } from '@shared/constants'
import {
  createTestI18n,
  createTestStore,
  elementPlusStubs
} from '../../../helpers/vue-test-helpers.js'

vi.mock('electron-is', () => ({
  default: {
    renderer: () => true,
    mas: () => false
  }
}))

vi.mock('@/components/Preference/HistoryDirectory', () => ({
  default: { name: 'mo-history-directory', template: '<div />' }
}))

vi.mock('@/components/Native/SelectDirectory', () => ({
  default: { name: 'mo-select-directory', template: '<div />' }
}))

vi.mock('@/components/Task/SelectTorrent', () => ({
  default: { name: 'mo-select-torrent', template: '<div />' }
}))

vi.mock('@/components/Icons/inbox', () => ({}))

const { default: AddTask } = await import('@/components/Task/AddTask.vue')

describe('AddTask', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        readText: vi.fn(() => Promise.resolve(''))
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  const mountAddTask = (props = {}) => {
    const store = createTestStore()
    const msg = vi.fn()
    msg.error = vi.fn()
    msg.warning = vi.fn()

    const wrapper = shallowMount(AddTask, {
      props: {
        visible: true,
        type: ADD_TASK_TYPE.URI,
        ...props
      },
      global: {
        plugins: [store, createTestI18n()],
        stubs: {
          ...elementPlusStubs,
          'mo-select-torrent': true,
          'mo-select-directory': true,
          'mo-history-directory': true,
          'mo-icon': true,
          Close: true
        },
        mocks: {
          $msg: msg,
          $router: { push: vi.fn(() => Promise.resolve()) }
        }
      }
    })

    return { wrapper, store, msg }
  }

  it('展开高级选项时对话框 top 更靠上', async () => {
    const { wrapper } = mountAddTask()
    expect(wrapper.vm.dialogTop).toBe('15vh')
    wrapper.vm.showAdvanced = true
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.dialogTop).toBe('8vh')
  })

  it('切换任务类型时 dispatch changeAddTaskType', () => {
    const { wrapper, store } = mountAddTask()
    const dispatchSpy = vi.spyOn(store, 'dispatch')
    wrapper.vm.handleAddTaskTabChange(ADD_TASK_TYPE.TORRENT)
    expect(dispatchSpy).toHaveBeenCalledWith('app/changeAddTaskType', ADD_TASK_TYPE.TORRENT)
  })

  it('检测到迅雷链接时弹出警告', () => {
    const { wrapper, msg } = mountAddTask()
    wrapper.vm.detectThunderResource('thunder://abc')
    expect(msg).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }))
  })

  it('关闭对话框时重置状态并隐藏', () => {
    const { wrapper, store } = mountAddTask()
    const dispatchSpy = vi.spyOn(store, 'dispatch')
    wrapper.vm.showAdvanced = true
    wrapper.vm.handleClose()
    expect(dispatchSpy).toHaveBeenCalledWith('app/hideAddTaskDialog')
    expect(dispatchSpy).toHaveBeenCalledWith('app/updateAddTaskOptions', {})
  })

  it('打开对话框时初始化分片数表单字段', async () => {
    vi.useFakeTimers()
    const { wrapper } = mountAddTask()
    wrapper.vm.handleOpen()
    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.split).toBe(16)
  })

  it('显示分片数输入控件', async () => {
    vi.useFakeTimers()
    const { wrapper } = mountAddTask()
    wrapper.vm.handleOpen()
    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const splitInput = wrapper.find('.el-input-number')
    expect(splitInput.exists()).toBe(true)
  })

  it('提交任务时携带自定义分片数', async () => {
    vi.useFakeTimers()
    const { wrapper, store } = mountAddTask()
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    wrapper.vm.handleOpen()
    await vi.runAllTimersAsync()
    wrapper.vm.form.uris = 'https://example.com/file.zip'
    wrapper.vm.form.split = 2
    await wrapper.vm.submitForm('taskForm')

    expect(dispatchSpy).toHaveBeenCalledWith(
      'task/addUri',
      expect.objectContaining({
        options: expect.objectContaining({ split: 2 })
      })
    )
  })

  it('选择目录时写入表单并记录历史', () => {
    const { wrapper, store } = mountAddTask()
    const dispatchSpy = vi.spyOn(store, 'dispatch')
    wrapper.vm.handleNativeDirectorySelected('/new/dir')
    expect(wrapper.vm.form.dir).toBe('/new/dir')
    expect(dispatchSpy).toHaveBeenCalledWith('preference/recordHistoryDirectory', '/new/dir')
  })
})
