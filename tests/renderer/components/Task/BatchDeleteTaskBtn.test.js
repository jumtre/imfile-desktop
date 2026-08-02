import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createTestI18n,
  elementPlusStubs
} from '../../../helpers/vue-test-helpers.js'

const commandsEmit = vi.hoisted(() => vi.fn())

vi.mock('@/components/CommandManager/instance', () => ({
  commands: { emit: commandsEmit }
}))

const { default: BatchDeleteTaskBtn } = await import('@/components/Task/BatchDeleteTaskBtn.vue')

describe('BatchDeleteTaskBtn', () => {
  beforeEach(() => {
    commandsEmit.mockClear()
  })

  it('点击时发出 batch-delete-task 命令', async () => {
    const wrapper = shallowMount(BatchDeleteTaskBtn, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          ...elementPlusStubs,
          'mo-icon': true
        }
      }
    })

    await wrapper.find('.el-button').trigger('click')
    expect(commandsEmit).toHaveBeenCalledWith('batch-delete-task', {
      deleteWithFiles: false
    })
  })

  it('Shift+点击时删除本地文件', () => {
    const wrapper = shallowMount(BatchDeleteTaskBtn, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          ...elementPlusStubs,
          'mo-icon': true
        }
      }
    })

    wrapper.vm.onBatchDeleteClick({ shiftKey: true })
    expect(commandsEmit).toHaveBeenCalledWith('batch-delete-task', {
      deleteWithFiles: true
    })
  })
})
