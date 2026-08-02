import { vi } from 'vitest'

export const createElectronLogMock = () => ({
  default: {
    transports: {
      file: {
        level: 'info',
        getFile: () => ({ path: '/mock/logs/imfile.log' })
      }
    },
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn()
  }
})
