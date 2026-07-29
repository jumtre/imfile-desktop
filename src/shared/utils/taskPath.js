import { resolve } from 'node:path'

import { getFileNameFromFile, isMagnetTask } from './index'

/** 解析任务在磁盘上的主路径（与 renderer/utils/native 行为一致） */
export const getTaskFullPath = (task) => {
  if (!task || typeof task !== 'object') {
    return ''
  }

  const { dir, files, bittorrent } = task
  const filesSafe = Array.isArray(files) ? files : []
  let result = dir ? resolve(dir) : ''

  if (isMagnetTask(task)) {
    return result
  }

  if (bittorrent && bittorrent.info && bittorrent.info.name) {
    result = resolve(result, bittorrent.info.name)
    return result
  }

  const [file] = filesSafe
  const path = file && file.path ? resolve(file.path) : ''
  let fileName = ''

  if (path) {
    result = path
  } else if (filesSafe.length === 1 && file) {
    fileName = getFileNameFromFile(file)
    if (fileName) {
      result = resolve(result, fileName)
    }
  }

  return result
}
