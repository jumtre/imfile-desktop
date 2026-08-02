import { describe, expect, it } from 'vitest'

import LocaleManager from '@shared/locales/LocaleManager'

describe('LocaleManager', () => {
  it('初始化 i18next 并切换语言', async () => {
    const manager = new LocaleManager({
      resources: {
        'en-US': { translation: { hello: 'Hello' } },
        'zh-CN': { translation: { hello: '你好' } }
      }
    })

    await manager.changeLanguage('zh-CN')
    expect(manager.getI18n().language).toBe('zh-CN')
    expect(manager.getI18n().t('hello')).toBe('你好')
  })

  it('changeLanguageByLocale 通过 locale 映射语言', async () => {
    const manager = new LocaleManager({
      resources: {
        'en-US': { translation: { app: 'App' } },
        'zh-CN': { translation: { app: '应用' } }
      }
    })

    await manager.changeLanguageByLocale('zh-CN')
    expect(manager.getI18n().t('app')).toBe('应用')
  })
})
