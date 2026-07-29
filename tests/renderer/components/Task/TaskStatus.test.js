import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TaskProgress from '@/components/Task/TaskProgress.vue'
import TaskStatus from '@/components/Task/TaskStatus.vue'
import { APP_THEME, TASK_STATUS } from '@shared/constants'

const elTagStub = {
  template: '<span class="el-tag" :data-type="type" :data-effect="effect"><slot /></span>',
  props: ['type', 'effect']
}

const elProgressStub = {
  template: '<div class="el-progress" :data-percentage="percentage" :data-status="status" :data-color="color"></div>',
  props: ['percentage', 'status', 'color', 'showText']
}

describe('TaskStatus', () => {
  it('根据任务状态渲染标签类型', () => {
    const wrapper = mount(TaskStatus, {
      props: { status: TASK_STATUS.ERROR, theme: APP_THEME.DARK },
      global: { stubs: { 'el-tag': elTagStub } }
    })
    const tag = wrapper.find('.el-tag')
    expect(tag.attributes('data-type')).toBe('danger')
    expect(tag.text()).toBe('ERROR')
  })

  it('完成状态映射为 success 类型', () => {
    const wrapper = mount(TaskStatus, {
      props: { status: TASK_STATUS.COMPLETE },
      global: { stubs: { 'el-tag': elTagStub } }
    })
    expect(wrapper.find('.el-tag').attributes('data-type')).toBe('success')
  })
})

describe('TaskProgress', () => {
  it('按已完成字节计算进度百分比', () => {
    const wrapper = mount(TaskProgress, {
      props: {
        total: 1000,
        completed: 250,
        status: TASK_STATUS.ACTIVE
      },
      global: { stubs: { 'el-progress': elProgressStub } }
    })
    const progress = wrapper.find('.el-progress')
    expect(progress.attributes('data-percentage')).toBe('25')
    expect(progress.attributes('data-status')).toBe('success')
  })

  it('非 active 状态不显示 success 样式', () => {
    const wrapper = mount(TaskProgress, {
      props: {
        total: 100,
        completed: 50,
        status: TASK_STATUS.PAUSED
      },
      global: { stubs: { 'el-progress': elProgressStub } }
    })
    expect(wrapper.find('.el-progress').attributes('data-status')).toBeUndefined()
  })
})
