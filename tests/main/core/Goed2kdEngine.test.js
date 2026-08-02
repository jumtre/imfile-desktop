import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  GOED2KD_DEFAULT_LISTEN_TCP_PORT,
  GOED2KD_DEFAULT_LISTEN_UDP_PORT
} from '@shared/constants'
import { createElectronIsMock } from '../../helpers/electron-mock.js'
import { createElectronLogMock } from '../../helpers/electron-log-mock.js'

vi.mock('electron-is', () => createElectronIsMock())
vi.mock('electron-log', () => createElectronLogMock())

const existsSync = vi.hoisted(() => vi.fn())
const readFileSync = vi.hoisted(() => vi.fn())

vi.mock('node:fs', () => ({
  existsSync,
  readFileSync
}))

const { parseEnginePortsFromConfig, readGoed2kdEnginePortsFromConfigSync } =
  await import('../../../src/main/core/Goed2kdEngine.js')

describe('parseEnginePortsFromConfig', () => {
  it('返回默认端口', () => {
    expect(parseEnginePortsFromConfig(null)).toEqual({
      listenPort: GOED2KD_DEFAULT_LISTEN_TCP_PORT,
      udpPort: GOED2KD_DEFAULT_LISTEN_UDP_PORT
    })
  })

  it('解析 engine.listen_port 与 udp_port', () => {
    expect(parseEnginePortsFromConfig({
      engine: {
        listen_port: 5000,
        udp_port: 5001
      }
    })).toEqual({
      listenPort: 5000,
      udpPort: 5001
    })
  })

  it('兼容 camelCase 字段', () => {
    expect(parseEnginePortsFromConfig({
      engine: {
        listenPort: 6000,
        udpPort: 6001
      }
    })).toEqual({
      listenPort: 6000,
      udpPort: 6001
    })
  })
})

describe('readGoed2kdEnginePortsFromConfigSync', () => {
  beforeEach(() => {
    existsSync.mockReset()
    readFileSync.mockReset()
  })

  it('配置文件不存在时返回默认端口', () => {
    existsSync.mockReturnValue(false)
    expect(readGoed2kdEnginePortsFromConfigSync('/tmp/missing.json')).toEqual({
      listenPort: GOED2KD_DEFAULT_LISTEN_TCP_PORT,
      udpPort: GOED2KD_DEFAULT_LISTEN_UDP_PORT
    })
  })

  it('从配置文件读取端口', () => {
    existsSync.mockReturnValue(true)
    readFileSync.mockReturnValue(JSON.stringify({
      engine: { listen_port: 4665, udp_port: 4666 }
    }))

    expect(readGoed2kdEnginePortsFromConfigSync('/tmp/goed2kd.json')).toEqual({
      listenPort: 4665,
      udpPort: 4666
    })
  })

  it('JSON 解析失败时回退默认端口', () => {
    existsSync.mockReturnValue(true)
    readFileSync.mockReturnValue('{bad-json')

    expect(readGoed2kdEnginePortsFromConfigSync('/tmp/bad.json')).toEqual({
      listenPort: GOED2KD_DEFAULT_LISTEN_TCP_PORT,
      udpPort: GOED2KD_DEFAULT_LISTEN_UDP_PORT
    })
  })
})
