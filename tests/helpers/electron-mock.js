import { vi } from 'vitest'

export const createElectronMock = (overrides = {}) => {
  const app = {
    getPath: vi.fn((name) => {
      const paths = {
        userData: '/mock/userData',
        logs: '/mock/logs',
        downloads: '/mock/downloads',
        exe: '/mock/imFile.exe'
      }
      return paths[name] || `/mock/${name}`
    }),
    getAppPath: vi.fn(() => '/mock/app'),
    isPackaged: false,
    setPath: vi.fn(),
    moveToApplicationsFolder: vi.fn(() => true),
    ...overrides.app
  }

  return {
    app,
    nativeTheme: {
      shouldUseDarkColors: false,
      ...overrides.nativeTheme
    },
    shell: {
      showItemInFolder: vi.fn(),
      ...overrides.shell
    }
  }
}

export const createElectronIsMock = (overrides = {}) => ({
  default: {
    dev: () => true,
    macOS: () => false,
    linux: () => process.platform === 'linux',
    windows: () => process.platform === 'win32',
    ...overrides
  }
})
