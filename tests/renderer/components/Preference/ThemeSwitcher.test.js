import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ThemeSwitcher from '@/components/Preference/ThemeSwitcher.vue'
import { APP_THEME } from '@shared/constants'
import { createTestI18n } from '../../../helpers/vue-test-helpers.js'

describe('ThemeSwitcher', () => {
  const mountSwitcher = (props = {}) => mount(ThemeSwitcher, {
    props: { value: APP_THEME.AUTO, ...props },
    global: {
      plugins: [createTestI18n()]
    }
  })

  it('渲染三种主题选项', () => {
    const wrapper = mountSwitcher()
    expect(wrapper.findAll('.theme-item')).toHaveLength(3)
    expect(wrapper.text()).toContain('自动')
    expect(wrapper.text()).toContain('浅色')
    expect(wrapper.text()).toContain('深色')
  })

  it('点击主题项触发 change 事件', async () => {
    const wrapper = mountSwitcher()
    await wrapper.find('.theme-item-dark').trigger('click')
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')[0]).toEqual([APP_THEME.DARK])
  })

  it('当前选中项带 active 样式', () => {
    const wrapper = mountSwitcher({ value: APP_THEME.LIGHT })
    expect(wrapper.find('.theme-item-light').classes()).toContain('active')
    expect(wrapper.find('.theme-item-dark').classes()).not.toContain('active')
  })
})
