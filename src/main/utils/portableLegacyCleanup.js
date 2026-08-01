import { existsSync, readdirSync, rmSync } from 'node:fs'

/**
 * 便携模式重定向 userData 后，移除 Electron 在 app.getPath('userData') 时
 * 预先创建、但已不再使用的空 AppData 目录（如 %APPDATA%\\imFile）。
 */
export function removeEmptyLegacyUserDataDir (legacyDir) {
  if (!legacyDir) {
    return
  }

  try {
    if (!existsSync(legacyDir)) {
      return
    }
    if (readdirSync(legacyDir).length === 0) {
      rmSync(legacyDir, { recursive: true, force: true })
    }
  } catch (err) {
    console.warn('[imFile] 便携模式：清理 AppData 空目录失败', err)
  }
}
