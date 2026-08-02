import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import {
  EMPTY_STRING,
  NONE_SELECTED_FILES
} from '@shared/constants'
import {
  createTestI18n,
  createTestStore,
  elementPlusStubs
} from '../../../helpers/vue-test-helpers.js'

vi.mock('@/components/TaskDetail/TaskFiles', () => ({
  default: {
    name: 'mo-task-files',
    template: '<div class="task-files-stub" />',
    methods: {
      toggleAllSelection: vi.fn(),
      clearSelection: vi.fn()
    }
  }
}))

const { default: SelectTorrent } = await import('@/components/Task/SelectTorrent.vue')

describe('SelectTorrent', () => {
  const mountSelectTorrent = (storeOverrides = {}) => {
    const store = createTestStore(storeOverrides)
    return {
      store,
      wrapper: shallowMount(SelectTorrent, {
        global: {
          plugins: [store, createTestI18n()],
          stubs: {
            ...elementPlusStubs,
            'mo-task-files': true,
            'mo-icon': true,
            'el-upload': { template: '<div class="el-upload"><slot /></div>' },
            'el-tooltip': { template: '<div><slot /></div>' }
          }
        }
      })
    }
  }

  it('无种子文件时显示上传区域', () => {
    const { wrapper } = mountSelectTorrent()
    expect(wrapper.vm.isTorrentsEmpty).toBe(true)
    expect(wrapper.find('.el-upload').exists()).toBe(true)
  })

  it('已有种子文件时显示文件列表区域', () => {
    const { wrapper } = mountSelectTorrent({
      appState: {
        addTaskTorrents: [{ name: 'demo.torrent', raw: {} }]
      }
    })
    expect(wrapper.vm.isTorrentsEmpty).toBe(false)
    expect(wrapper.find('.selective-torrent').exists()).toBe(true)
  })

  it('选择文件时 dispatch addTaskAddTorrents', () => {
    const { wrapper, store } = mountSelectTorrent()
    const dispatchSpy = vi.spyOn(store, 'dispatch')
    const fileList = [{ name: 'demo.torrent' }]

    wrapper.vm.handleChange({}, fileList)
    expect(dispatchSpy).toHaveBeenCalledWith('app/addTaskAddTorrents', { fileList })
  })

  it('删除种子时清空 store 中的 torrent 列表', () => {
    const { wrapper, store } = mountSelectTorrent({
      appState: {
        addTaskTorrents: [{ name: 'demo.torrent', raw: {} }]
      }
    })
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    wrapper.vm.handleTrashClick()
    expect(dispatchSpy).toHaveBeenCalledWith('app/addTaskAddTorrents', { fileList: [] })
  })

  it('reset 时发出空 torrent 变更事件', () => {
    const { wrapper } = mountSelectTorrent()
    wrapper.vm.name = 'demo.torrent'
    wrapper.vm.currentTorrent = 'base64-data'

    wrapper.vm.reset()
    expect(wrapper.vm.name).toBe(EMPTY_STRING)
    expect(wrapper.vm.currentTorrent).toBe(EMPTY_STRING)
    expect(wrapper.emitted('torrent-change')).toEqual([[EMPTY_STRING, NONE_SELECTED_FILES]])
  })

  it('currentTorrent 为空时不向外冒泡 selection-change', () => {
    const { wrapper } = mountSelectTorrent()
    wrapper.vm.currentTorrent = EMPTY_STRING

    wrapper.vm.handleSelectionChange('1')
    expect(wrapper.emitted('torrent-change')).toBeUndefined()
  })
})
