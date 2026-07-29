import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import HistoryDirectory from '@/components/Preference/HistoryDirectory.vue'
import { createTestStore, elementPlusStubs } from '../../../helpers/vue-test-helpers.js'

describe('HistoryDirectory', () => {
  const mountHistory = (storeOverrides = {}) => {
    const store = createTestStore(storeOverrides)
    const wrapper = mount(HistoryDirectory, {
      global: {
        plugins: [store],
        stubs: elementPlusStubs
      }
    })
    return { wrapper, store }
  }

  it('无历史目录时显示空状态并禁用按钮', () => {
    const { wrapper } = mountHistory({
      preferenceConfig: {
        historyDirectories: [],
        favoriteDirectories: []
      }
    })
    expect(wrapper.find('.mo-directory-empty').exists()).toBe(true)
    expect(wrapper.vm.popoverDisabled).toBe(true)
  })

  it('选择目录时触发 selected 事件', async () => {
    const { wrapper } = mountHistory({
      preferenceConfig: {
        historyDirectories: ['/downloads/a'],
        favoriteDirectories: []
      }
    })
    await wrapper.vm.handleSelectItem('/downloads/a')
    expect(wrapper.emitted('selected')).toEqual([['/downloads/a']])
  })

  it('收藏目录时 dispatch preference/favoriteDirectory', () => {
    const { wrapper, store } = mountHistory({
      preferenceConfig: {
        historyDirectories: ['/downloads/new'],
        favoriteDirectories: []
      }
    })
    const dispatchSpy = vi.spyOn(store, 'dispatch')
    wrapper.vm.handleFavoriteItem('/downloads/new')
    expect(dispatchSpy).toHaveBeenCalledWith('preference/favoriteDirectory', '/downloads/new')
  })

  it('有收藏与历史目录时显示分隔线', () => {
    const { wrapper } = mountHistory({
      preferenceConfig: {
        historyDirectories: ['/downloads/h'],
        favoriteDirectories: ['/downloads/fav']
      }
    })
    expect(wrapper.vm.showDivider).toBe(true)
    expect(wrapper.find('.mo-directory-divider').exists()).toBe(true)
  })
})
