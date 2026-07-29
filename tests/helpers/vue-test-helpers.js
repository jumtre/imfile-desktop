import { createI18n } from 'vue-i18n'
import { createStore } from 'vuex'
import { vi } from 'vitest'

import { APP_THEME, ENGINE_MAX_CONNECTION_PER_SERVER } from '@shared/constants'

const defaultPreferenceConfig = {
  allProxy: '',
  dir: '/downloads',
  engineMaxConnectionPerServer: ENGINE_MAX_CONNECTION_PER_SERVER,
  followMetalink: true,
  followTorrent: true,
  historyDirectories: ['/downloads/history'],
  favoriteDirectories: ['/downloads/fav'],
  hideAppMenu: false,
  locale: 'zh-CN',
  maxConnectionPerServer: 16,
  newTaskShowDownloading: true,
  split: 16,
  theme: APP_THEME.LIGHT,
  maxOverallDownloadLimit: 0,
  maxOverallUploadLimit: 0,
  continue: true,
  autoHideWindow: false,
  btForceEncryption: false,
  btSaveMetadata: true,
  keepSeeding: false,
  keepWindowState: false,
  openAtLogin: false,
  pauseMetadata: false,
  resumeAllWhenAppLaunched: true,
  runMode: 1,
  seedRatio: 1,
  seedTime: 60,
  showProgressBar: true,
  taskNotification: true,
  taskCompleteSound: true,
  traySpeedometer: false
}

const testMessages = {
  preferences: {
    basic: '基本设置',
    advanced: '高级设置',
    appearance: '外观',
    'theme-auto': '自动',
    'theme-light': '浅色',
    'theme-dark': '深色',
    'hide-app-menu': '隐藏菜单',
    'auto-hide-window': '自动隐藏窗口',
    'tray-speedometer': '托盘测速',
    'show-progress-bar': '显示进度条',
    'run-mode': '运行模式',
    language: '语言',
    'change-language': '切换语言',
    startup: '启动',
    'open-at-login': '开机启动',
    'keep-window-state': '记住窗口状态',
    'auto-resume-all': '自动恢复全部',
    'default-dir': '默认目录',
    'mas-default-dir-tips': 'MAS 默认目录提示',
    'transfer-settings': '传输设置',
    'transfer-speed-upload': '上传限速',
    'transfer-speed-download': '下载限速',
    'bt-settings': 'BT 设置',
    'bt-save-metadata': '保存元数据',
    'bt-auto-download-content': '自动下载内容',
    'bt-force-encryption': '强制加密',
    'keep-seeding': '持续做种',
    'seed-ratio': '做种比率',
    'seed-time': '做种时间',
    'seed-time-unit': '分钟',
    'task-manage': '任务管理',
    'max-concurrent-downloads': '最大并发下载',
    'max-connection-per-server': '单服务器最大连接',
    continue: '断点续传',
    'new-task-show-downloading': '新任务显示下载中',
    'task-completed-notify': '任务完成通知',
    'task-complete-sound': '任务完成声音',
    'no-confirm-before-delete-task': '删除任务不确认',
    save: '保存',
    discard: '放弃'
  },
  task: {
    'uri-task': '链接任务',
    'torrent-task': '种子任务',
    'thunder-link-tips': '检测到迅雷链接',
    'show-advanced-options': '高级选项'
  },
  app: {
    cancel: '取消',
    submit: '提交'
  }
}

export const createTestI18n = () => createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    'zh-CN': testMessages,
    zh: testMessages
  }
})

export const createTestStore = (overrides = {}) => {
  const preferenceActions = {
    recordHistoryDirectory: vi.fn(),
    favoriteDirectory: vi.fn(),
    cancelFavoriteDirectory: vi.fn(),
    removeDirectory: vi.fn(),
    fetchPreference: vi.fn(() => Promise.resolve(defaultPreferenceConfig)),
    ...(overrides.preferenceActions || {})
  }

  const appActions = {
    hideAddTaskDialog: vi.fn(),
    updateAddTaskOptions: vi.fn(),
    changeAddTaskType: vi.fn(),
    ...(overrides.appActions || {})
  }

  return createStore({
    modules: {
      preference: {
        namespaced: true,
        state: {
          config: {
            ...defaultPreferenceConfig,
            ...(overrides.preferenceConfig || {})
          }
        },
        actions: preferenceActions
      },
      app: {
        namespaced: true,
        state: {
          taskList: [],
          addTaskUrl: '',
          addTaskOptions: {},
          ...(overrides.appState || {})
        },
        actions: appActions
      },
      task: {
        namespaced: true,
        actions: {
          addUri: vi.fn(() => Promise.resolve()),
          addTorrent: vi.fn(() => Promise.resolve()),
          ...(overrides.taskActions || {})
        }
      }
    }
  })
}

export const elementPlusStubs = {
  'el-dialog': { template: '<div class="el-dialog"><slot /><slot name="footer" /></div>', props: ['modelValue'] },
  'el-form': {
    template: '<form class="el-form"><slot /></form>',
    methods: {
      validate (cb) {
        const valid = true
        if (cb) cb(valid)
      }
    }
  },
  'el-form-item': { template: '<div class="el-form-item"><slot /></div>' },
  'el-tabs': { template: '<div class="el-tabs"><slot /></div>', props: ['modelValue'] },
  'el-tab-pane': { template: '<div class="el-tab-pane"><slot /></div>', props: ['name', 'label'] },
  'el-input': { template: '<input class="el-input" />' },
  'el-button': { template: '<button class="el-button"><slot /></button>' },
  'el-row': { template: '<div class="el-row"><slot /></div>' },
  'el-col': { template: '<div class="el-col"><slot /></div>', props: ['span'] },
  'el-checkbox': { template: '<label class="el-checkbox"><slot /></label>' },
  'el-container': { template: '<div class="el-container"><slot /></div>' },
  'el-header': { template: '<div class="el-header"><slot /></div>' },
  'el-main': { template: '<div class="el-main"><slot /></div>' },
  'el-select': { template: '<select class="el-select"><slot /></select>' },
  'el-option': { template: '<option class="el-option"><slot /></option>' },
  'el-input-number': { template: '<input type="number" class="el-input-number" />' },
  'el-popover': { template: '<div class="el-popover"><slot /><slot name="reference" /></div>' },
  'el-empty': { template: '<div class="el-empty"></div>' },
  'el-icon': { template: '<i class="el-icon"><slot /></i>' }
}
