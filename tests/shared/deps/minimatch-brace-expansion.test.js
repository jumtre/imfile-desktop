/**
 * 守护打包工具链中的 minimatch@3 ↔ brace-expansion@1.x 兼容性。
 *
 * CI 的 webpack / 单元测试不会走到 electron-builder → @electron/asar → glob@7
 * → minimatch@3 这条路径。若 pnpm override 把 brace-expansion@1.x 跨主版本
 * 强制到 5.x，export 形态从「默认导出函数」变为「命名导出对象」，带 `{}`
 * 的 glob 会在运行时抛出 TypeError: expand is not a function。
 *
 * 本文件在 Vitest 中直接加载该传递依赖，确保 override / 锁文件回归时能立刻失败。
 */
import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

const rootRequire = createRequire(import.meta.url)

/**
 * 解析 electron-builder 依赖树中的 @electron/asar。
 * @returns {NodeRequire}
 */
function createAsarRequire () {
  const electronBuilderRequire = createRequire(
    rootRequire.resolve('electron-builder/package.json')
  )
  return createRequire(
    electronBuilderRequire.resolve('@electron/asar/package.json')
  )
}

/**
 * 从给定入口模块解析其依赖的 minimatch，并带回该 minimatch 实际链接的 brace-expansion。
 * @param {string} minimatchEntry require.resolve('minimatch') 的结果
 * @returns {{ minimatch: Function, braceExpansion: unknown, versions: { minimatch: string, braceExpansion: string } }}
 */
function loadMinimatchStack (minimatchEntry) {
  const minimatchRequire = createRequire(minimatchEntry)
  return {
    minimatch: minimatchRequire('minimatch'),
    braceExpansion: minimatchRequire('brace-expansion'),
    versions: {
      minimatch: minimatchRequire('minimatch/package.json').version,
      braceExpansion: minimatchRequire('brace-expansion/package.json').version
    }
  }
}

/**
 * 沿着 electron-builder → @electron/asar 解析到其依赖的 minimatch@3。
 * @returns {{ minimatch: Function, braceExpansion: unknown, versions: { minimatch: string, braceExpansion: string } }}
 */
function loadAsarMinimatchStack () {
  return loadMinimatchStack(createAsarRequire().resolve('minimatch'))
}

/**
 * 沿着 @electron/asar → glob@7 → minimatch@3 再解析一次，覆盖另一条消费链。
 * @returns {{ minimatch: Function, braceExpansion: unknown, versions: { minimatch: string, braceExpansion: string } }}
 */
function loadGlobMinimatchStack () {
  const asarRequire = createAsarRequire()
  const globRequire = createRequire(asarRequire.resolve('glob'))
  return loadMinimatchStack(globRequire.resolve('minimatch'))
}

describe('minimatch@3 / brace-expansion 兼容性（打包工具链）', () => {
  it('asar 依赖的 minimatch@3 应使用 brace-expansion 1.x，且默认导出为函数', () => {
    const { braceExpansion, versions } = loadAsarMinimatchStack()

    expect(versions.minimatch.startsWith('3.')).toBe(true)
    expect(versions.braceExpansion.startsWith('1.')).toBe(true)
    expect(typeof braceExpansion).toBe('function')
  })

  it('带花括号的 glob 模式应能匹配，而不是抛出 expand is not a function', () => {
    const { minimatch } = loadAsarMinimatchStack()

    expect(minimatch('foo.js', '*.js')).toBe(true)
    expect(minimatch('a.txt', '*.{js,txt}')).toBe(true)
    expect(minimatch('b.md', '*.{js,txt}')).toBe(false)
    expect(minimatch('file-2.txt', 'file-{1..3}.txt')).toBe(true)
    expect(minimatch('file-9.txt', 'file-{1..3}.txt')).toBe(false)
    expect(() => minimatch('demo.js', 'demo.{js,ts}')).not.toThrow()
  })

  it('glob@7 → minimatch@3 链路同样要求 brace-expansion 默认可调用', () => {
    const { minimatch, braceExpansion } = loadGlobMinimatchStack()

    expect(typeof braceExpansion).toBe('function')
    expect(minimatch('index.vue', 'index.{js,vue}')).toBe(true)
    expect(minimatch('index.css', 'index.{js,vue}')).toBe(false)
  })
})
