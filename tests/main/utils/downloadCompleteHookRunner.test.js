import { beforeEach, describe, expect, it, vi } from 'vitest'

const spawnMock = vi.fn()

vi.mock('node:child_process', () => ({
  spawn: (...args) => spawnMock(...args)
}))

vi.mock('electron-is', () => ({
  default: {
    windows: () => process.platform === 'win32'
  }
}))

vi.mock('../../../src/main/core/Logger.js', () => ({
  default: { warn: vi.fn() }
}))

const { spawnDownloadCompleteCommand } = await import(
  '../../../src/main/utils/downloadCompleteHookRunner.js'
)

describe('spawnDownloadCompleteCommand', () => {
  beforeEach(() => {
    spawnMock.mockReset()
    spawnMock.mockReturnValue({
      on: vi.fn(),
      unref: vi.fn()
    })
  })

  it('Unix 下直接 spawn 命令与参数', () => {
    const originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'linux' })

    spawnDownloadCompleteCommand('/usr/bin/notify.sh', 'gid1', '1', '/tmp/a.zip')

    expect(spawnMock).toHaveBeenCalledWith(
      '/usr/bin/notify.sh',
      ['gid1', '1', '/tmp/a.zip'],
      expect.objectContaining({ detached: true, stdio: 'ignore' })
    )

    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  it('Windows 下 .bat 通过 cmd.exe 执行', () => {
    const originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'win32' })

    spawnDownloadCompleteCommand('C:\\hooks\\done.bat', 'g2', '2', 'C:\\file.zip')

    expect(spawnMock).toHaveBeenCalledWith(
      process.env.comspec || 'cmd.exe',
      ['/d', '/s', '/c', 'C:\\hooks\\done.bat', 'g2', '2', 'C:\\file.zip'],
      expect.objectContaining({ windowsHide: true })
    )

    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  it('spawn 失败时返回 null', () => {
    spawnMock.mockImplementation(() => {
      throw new Error('ENOENT')
    })
    expect(spawnDownloadCompleteCommand('/missing', 'g', '1', '/x')).toBeNull()
  })
})
