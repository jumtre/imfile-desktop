import { resolve } from 'node:path'

import {
  getFileNameFromFile,
  isTaskFileEntrySelected
} from './index'
import { getTaskFullPath } from './taskPath'

const hasFileSelectionMeta = (files = []) => {
  return files.some((file) => file.selected != null || file.Selected != null)
}

/**
 * 按 aria2 Event Hook 约定构造参数：GID、文件数、首个文件路径。
 * @see https://aria2.github.io/manual/en/html/aria2c.html#event-hook
 */
export const buildDownloadCompleteHookArgs = (task = {}, fallbackPath = '') => {
  const gid = String(task.gid || '')
  const files = Array.isArray(task.files) ? task.files : []
  const selectedFiles = files.filter((file) => isTaskFileEntrySelected(file))
  const relevantFiles = hasFileSelectionMeta(files) ? selectedFiles : files
  const resolvedFallback = String(fallbackPath || getTaskFullPath(task) || '')

  let numFiles = relevantFiles.length
  if (numFiles === 0 && resolvedFallback) {
    numFiles = 1
  }

  let filePath = resolvedFallback
  const first = relevantFiles[0]
  if (first) {
    if (first.path) {
      filePath = resolve(String(first.path))
    } else if (relevantFiles.length === 1 && task.dir) {
      const name = getFileNameFromFile(first)
      if (name) {
        filePath = resolve(String(task.dir), name)
      }
    }
  }

  return {
    gid,
    numFiles: String(numFiles),
    filePath
  }
}
