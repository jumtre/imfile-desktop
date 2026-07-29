import { describe, expect, it } from 'vitest'

import {
  engineArchMap,
  engineGoAria2BinMap,
  getGoAria2ExecutableNames,
  goed2kdBinMap
} from '../../../src/main/configs/engine.js'

describe('main/configs/engine', () => {
  it('各平台 go-aria2 默认可执行文件名', () => {
    expect(engineGoAria2BinMap.win32).toBe('go-aria2.exe')
    expect(engineGoAria2BinMap.linux).toBe('go-aria2')
    expect(engineGoAria2BinMap.darwin).toBe('go-aria2')
  })

  it('按优先顺序返回 go-aria2 候选文件名', () => {
    expect(getGoAria2ExecutableNames('win32')).toEqual(['go-aria2.exe', 'go-aria2c.exe'])
    expect(getGoAria2ExecutableNames('linux')).toEqual(['go-aria2', 'go-aria2c'])
  })

  it('goed2kd 各平台二进制名', () => {
    expect(goed2kdBinMap.win32).toBe('goed2kd.exe')
    expect(goed2kdBinMap.darwin).toBe('goed2kd')
  })

  it('引擎架构目录映射', () => {
    expect(engineArchMap.linux.arm).toBe('armv7l')
    expect(engineArchMap.win32.arm64).toBe('arm64')
    expect(engineArchMap.darwin.arm64).toBe('arm64')
  })
})
