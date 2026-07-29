import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { APP_THEME } from '@shared/constants'
import {
  createTestI18n,
  createTestStore,
  elementPlusStubs
} from '../../../helpers/vue-test-helpers.js'

vi.mock('electron-is', () => ({
  default: {
    renderer: () => true,
    macOS: () => false,
    linux: () => true,
    windows: () => false,
    mas: () => false
  }
}))

vi.mock('@electron/remote', () => ({
  dialog: { showOpenDialog: vi.fn() }
}))

vi.mock('@/components/Locale', () => ({
  getLocaleManager: () => ({
    changeLanguage: vi.fn()
  })
}))

const { default: Basic } = await import('@/components/Preference/Basic.vue')

describe('Preference Basic', () => {
  const mountBasic = () => {
    const store = createTestStore()
    const wrapper = shallowMount(Basic, {
      global: {
        plugins: [store, createTestI18n()],
        stubs: {
          ...elementPlusStubs,
          'el-switch': true,
          'mo-theme-switcher': true,
          'mo-history-directory': true,
          'mo-select-directory': true,
          'mo-subnav-switcher': true
        },
        mocks: {
          $router: { push: vi.fn(() => Promise.resolve()) }
        }
      }
    })
    return { wrapper, store }
  }

  it('初始化表单包含主题与下载目录', () => {
    const { wrapper } = mountBasic()
    expect(wrapper.vm.form.theme).toBe(APP_THEME.LIGHT)
    expect(wrapper.vm.form.dir).toBe('/downloads')
  })

  it('handleThemeChange 更新表单主题', () => {
    const { wrapper } = mountBasic()
    wrapper.vm.handleThemeChange(APP_THEME.DARK)
    expect(wrapper.vm.form.theme).toBe(APP_THEME.DARK)
  })

  it('onKeepSeedingChange 启用做种时重置比率与时间', () => {
    const { wrapper } = mountBasic()
    wrapper.vm.onKeepSeedingChange(true)
    expect(wrapper.vm.form.seedRatio).toBe(0)
    expect(wrapper.vm.form.seedTime).toBe(525600)
  })

  it('maxOverallDownloadLimitParsed 设置限速值', () => {
    const { wrapper } = mountBasic()
    wrapper.vm.downloadUnit = 'K'
    wrapper.vm.maxOverallDownloadLimitParsed = 2048
    expect(wrapper.vm.form.maxOverallDownloadLimit).toBe('2048K')
  })

  it('nav 跳转到高级设置页', async () => {
    const { wrapper } = mountBasic()
    await wrapper.vm.nav('advanced')
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith({ path: '/preference/advanced' })
  })
})
