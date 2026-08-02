import { describe, expect, it, vi } from 'vitest'

import { createElectronLogMock } from '../../helpers/electron-log-mock.js'

vi.mock('@achingbrain/nat-port-mapper', () => ({
  upnpNat: vi.fn(),
  pmpNat: vi.fn()
}))

vi.mock('default-gateway', () => ({
  gateway4sync: vi.fn()
}))

vi.mock('electron-log', () => createElectronLogMock())

const { default: UPnPManager } = await import('../../../src/main/core/UPnPManager.js')

describe('UPnPManager', () => {
  it('getPortMappingStatus 反映各端口映射状态', () => {
    const manager = new UPnPManager()
    const status = manager.getPortMappingStatus(6881, 6882, 4661, 4662)
    expect(status).toEqual({
      btMapped: false,
      dhtMapped: false,
      ed2kTcpMapped: false,
      ed2kUdpMapped: false
    })
  })

  it('getLocalHostForMap 无网关时返回局域网 IPv4', () => {
    const manager = new UPnPManager()
    const host = manager.getLocalHostForMap()
    expect(host).toMatch(/^\d+\.\d+\.\d+\.\d+$|^::1$/)
  })

  it('_map 未指定端口时抛出错误', async () => {
    const manager = new UPnPManager()
    await expect(manager.map()).rejects.toThrow('[imFile] port was not specified')
  })

  it('_unmap 未映射端口时直接返回', async () => {
    const manager = new UPnPManager()
    await expect(manager.unmap(9999)).resolves.toBeUndefined()
  })
})
