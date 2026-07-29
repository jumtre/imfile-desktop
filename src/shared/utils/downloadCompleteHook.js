import { resolve } from 'node:path'

import { getFileNameFromFile, isTaskFileEntrySelected } from './index'

/**
 * 按 aria2 Event Hook 约定构造参数：GID、文件数、首个文件路径。
 * @see https://aria2.github.io/manual/en/html/aria2c.html#event-hook
 */
export const buildDownloadCompleteHookArgs = (task = {}, fallbackPath = '') => {
  const gid = String(task.gid || '')
  const files = Array.isArray(task.files) ? task.files : []
  const selectedFiles = files.filter((file) => isTaskFileEntrySelected(file))
  const relevantFiles = selectedFiles.length > 0 ? selectedFiles : files
  const numFiles = relevantFiles.length > 0
    ? relevantFiles.length
    : (fallbackPath ? 1 : 0)

  let filePath = String(fallbackPath || '')
  const first = relevantFiles[0]
  if (first) {
    if (first.path) {
      filePath = resolve(String(first.path))
    } else if (numFiles === 1) {
      const name = getFileNameFromFile(first)
      if (name && task.dir) {
        filePath = resolve(String(task.dir), name)
      }
    }
  }

  return {
    gid,
    numFiles: String(Math.max(numFiles, 1)),
    filePath
  }
}
