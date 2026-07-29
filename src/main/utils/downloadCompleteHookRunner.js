import { spawn } from 'node:child_process'
import is from 'electron-is'

import logger from '../core/Logger'

/**
 * 启动下载完成钩子进程（跨平台处理 .bat/.cmd）。
 * @returns {import('node:child_process').ChildProcess | null}
 */
export const spawnDownloadCompleteCommand = (command, gid, numFiles, filePath) => {
  const args = [gid, numFiles, filePath]
  const spawnOpts = { detached: true, stdio: 'ignore' }
  if (is.windows()) {
    spawnOpts.windowsHide = true
  }

  let executable = command
  let spawnArgs = args

  if (is.windows() && /\.(bat|cmd)$/i.test(command)) {
    executable = process.env.comspec || 'cmd.exe'
    spawnArgs = ['/d', '/s', '/c', command, ...args]
  }

  try {
    const child = spawn(executable, spawnArgs, spawnOpts)
    child.on('error', (err) => {
      logger.warn('[imFile] download-complete hook error:', err.message)
    })
    child.unref()
    return child
  } catch (err) {
    logger.warn('[imFile] download-complete hook spawn failed:', err.message)
    return null
  }
}
