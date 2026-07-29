import { describe, expect, it, vi } from 'vitest'

import { createElectronIsMock, createElectronMock } from '../../helpers/electron-mock.js'

vi.mock('electron', () => createElectronMock())
vi.mock('electron-is', () => createElectronIsMock())
vi.mock('../../../src/main/core/Logger.js', () => ({
  default: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  }
}))

const {
  checkIsSupportedSchema,
  convertArrayBufferToBuffer,
  getEngineArch,
  isGoAria2EngineBin,
  parseArgvAsUrl,
  splitArgv,
  transformConfig
} = await import('../../../src/main/utils/index.js')

describe('main/utils splitArgv', () => {
  it('拆分位置参数与 --key=value 形式', () => {
    expect(splitArgv(['app', '--foo=bar', 'file.torrent', '--flag'])).toEqual({
      args: ['app', 'file.torrent'],
      extra: { '--foo': 'bar', '--flag': '1' }
    })
  })
})

describe('main/utils checkIsSupportedSchema', () => {
  it('识别支持的下载协议', () => {
    expect(checkIsSupportedSchema('https://example.com/a')).toBe(true)
    expect(checkIsSupportedSchema('magnet:?xt=urn:btih:abc')).toBe(true)
    expect(checkIsSupportedSchema('ed2k://|file|a|1|HASH|/')).toBe(true)
    expect(checkIsSupportedSchema('file:///tmp/a')).toBe(false)
  })
})

describe('main/utils parseArgvAsUrl', () => {
  it('从 argv 提取支持的 URL', () => {
    expect(parseArgvAsUrl(['imFile', 'https://example.com/file.zip'])).toBe(
      'https://example.com/file.zip'
    )
    expect(parseArgvAsUrl(['imFile'])).toBeUndefined()
    expect(parseArgvAsUrl(['imFile', '/path/to/file'])).toBeUndefined()
  })
})

describe('main/utils transformConfig', () => {
  it('将配置对象转为 aria2 命令行参数', () => {
    expect(transformConfig({ 'max-connection-per-server': 16, dir: '/tmp', empty: '' })).toEqual([
      '--max-connection-per-server=16',
      '--dir=/tmp'
    ])
  })
})

describe('main/utils isGoAria2EngineBin', () => {
  it('根据可执行文件名判断 go-aria2 引擎', () => {
    expect(isGoAria2EngineBin('/engine/go-aria2')).toBe(true)
    expect(isGoAria2EngineBin('/engine/go-aria2c.exe')).toBe(true)
    expect(isGoAria2EngineBin('/engine/aria2c')).toBe(false)
    expect(isGoAria2EngineBin('')).toBe(false)
  })
})

describe('main/utils getEngineArch', () => {
  it('映射平台架构到 extra 目录名', () => {
    expect(getEngineArch('linux', 'x64')).toBe('x64')
    expect(getEngineArch('linux', 'arm64')).toBe('arm64')
    expect(getEngineArch('win32', 'arm64')).toBe('arm64')
    expect(getEngineArch('unsupported', 'x64')).toBe('')
  })
})

describe('main/utils convertArrayBufferToBuffer', () => {
  it('将 ArrayBuffer 转为 Node Buffer', () => {
    const arrayBuffer = new Uint8Array([1, 2, 3, 255]).buffer
    const buffer = convertArrayBufferToBuffer(arrayBuffer)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect([...buffer]).toEqual([1, 2, 3, 255])
  })
})
