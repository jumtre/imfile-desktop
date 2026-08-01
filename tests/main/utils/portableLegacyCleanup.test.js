import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { removeEmptyLegacyUserDataDir } from '../../../src/main/utils/portableLegacyCleanup'

describe('removeEmptyLegacyUserDataDir', () => {
  it('移除空目录', () => {
    const legacyDir = join(tmpdir(), `imfile-empty-legacy-${Date.now()}`)
    mkdirSync(legacyDir, { recursive: true })

    removeEmptyLegacyUserDataDir(legacyDir)

    expect(existsSync(legacyDir)).toBe(false)
  })

  it('保留非空目录', () => {
    const legacyDir = join(tmpdir(), `imfile-nonempty-legacy-${Date.now()}`)
    mkdirSync(legacyDir, { recursive: true })
    writeFileSync(join(legacyDir, 'user.json'), '{}')

    removeEmptyLegacyUserDataDir(legacyDir)

    expect(existsSync(legacyDir)).toBe(true)
    rmSync(legacyDir, { recursive: true, force: true })
  })

  it('忽略不存在的目录', () => {
    const legacyDir = join(tmpdir(), `imfile-missing-legacy-${Date.now()}`)

    expect(() => removeEmptyLegacyUserDataDir(legacyDir)).not.toThrow()
  })

  it('忽略空路径', () => {
    expect(() => removeEmptyLegacyUserDataDir('')).not.toThrow()
    expect(() => removeEmptyLegacyUserDataDir(null)).not.toThrow()
  })
})
