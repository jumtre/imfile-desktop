import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TaskProgressInfo from '@/components/Task/TaskProgressInfo.vue'
import { TASK_STATUS } from '@shared/constants'
import { createTestI18n } from '../../../helpers/vue-test-helpers.js'

describe('TaskProgressInfo', () => {
  const mountProgressInfo = (task) => {
    return mount(TaskProgressInfo, {
      props: { task },
      global: {
        plugins: [createTestI18n()],
        stubs: {
          'mo-icon': true
        }
      }
    })
  }

  it('下载中任务显示上下行速度', () => {
    const wrapper = mountProgressInfo({
      status: TASK_STATUS.ACTIVE,
      downloadSpeed: 2048,
      uploadSpeed: 1024,
      totalLength: 1000,
      completedLength: 500,
      connections: 4,
      bittorrent: null
    })

    expect(wrapper.vm.isActive).toBe(true)
    expect(wrapper.text()).toContain('2.0 KB/s')
    expect(wrapper.text()).toContain('1.0 KB/s')
    expect(wrapper.text()).toContain('4')
  })

  it('非 active 状态不展示速度信息', () => {
    const wrapper = mountProgressInfo({
      status: TASK_STATUS.PAUSED,
      downloadSpeed: 2048,
      uploadSpeed: 1024,
      totalLength: 1000,
      completedLength: 500
    })

    expect(wrapper.vm.isActive).toBe(false)
    expect(wrapper.find('.task-speed-info').exists()).toBe(false)
  })

  it('计算剩余时间', () => {
    const wrapper = mountProgressInfo({
      status: TASK_STATUS.ACTIVE,
      totalLength: 1000,
      completedLength: 500,
      downloadSpeed: 100
    })

    expect(wrapper.vm.remaining).toBe(5)
    expect(wrapper.text()).toContain('剩余')
  })

  it('BT 任务显示做种数', () => {
    const wrapper = mountProgressInfo({
      status: TASK_STATUS.ACTIVE,
      downloadSpeed: 100,
      uploadSpeed: 0,
      totalLength: 1000,
      completedLength: 100,
      connections: 2,
      numSeeders: 12,
      bittorrent: {}
    })

    expect(wrapper.vm.isBT).toBe(true)
    expect(wrapper.text()).toContain('12')
  })
})
