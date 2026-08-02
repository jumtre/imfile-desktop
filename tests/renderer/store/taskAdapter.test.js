import { describe, expect, it } from 'vitest'

import { TASK_STATUS } from '@shared/constants'
import {
  adaptAria2Task,
  adaptGoed2kdTask,
  adaptTaskForMainFlow,
  buildTaskKey,
  getTaskDisplayName
} from '@/store/taskAdapter'

const VALID_HASH = '0123456789abcdef0123456789abcdef01234567'

describe('buildTaskKey', () => {
  it('拼接 engine 与 id', () => {
    expect(buildTaskKey('aria2', 'abc')).toBe('aria2:abc')
    expect(buildTaskKey('goed2kd', VALID_HASH)).toBe(`goed2kd:${VALID_HASH}`)
  })
})

describe('adaptAria2Task', () => {
  it('规范化 aria2 任务字段', () => {
    const raw = {
      gid: 'aria2-gid-1',
      status: 'downloading',
      totalLength: '1024',
      completedLength: '512'
    }
    const task = adaptAria2Task(raw)

    expect(task).toMatchObject({
      engine: 'aria2',
      id: 'aria2-gid-1',
      gid: 'aria2-gid-1',
      status: TASK_STATUS.ACTIVE,
      taskKey: 'aria2:aria2-gid-1',
      totalLength: '1024',
      completedLength: '512'
    })
    expect(task.raw).toBe(raw)
  })

  it('缺少 gid 时 id 为空字符串', () => {
    const task = adaptAria2Task({ status: 'waiting' })
    expect(task.id).toBe('')
    expect(task.taskKey).toBe('aria2:')
    expect(task.status).toBe(TASK_STATUS.WAITING)
  })
})

describe('adaptGoed2kdTask', () => {
  it('映射 goed2kd 任务字段与进度', () => {
    const raw = {
      hash: VALID_HASH,
      file_name: 'movie.mkv',
      file_path: '/downloads/movie.mkv',
      total_wanted: 1000,
      total_done: 250,
      download_rate: 128000,
      status: 'downloading'
    }
    const task = adaptGoed2kdTask(raw)

    expect(task).toMatchObject({
      engine: 'goed2kd',
      id: VALID_HASH,
      gid: VALID_HASH,
      hash: VALID_HASH,
      taskKey: `goed2kd:${VALID_HASH}`,
      status: TASK_STATUS.ACTIVE,
      name: 'movie.mkv',
      completedLength: 250,
      totalLength: 1000,
      downloadSpeed: 128000,
      progress: 0.25,
      dir: '/downloads',
      bittorrent: null,
      peers: []
    })
    expect(task.files).toEqual([{ path: '/downloads/movie.mkv' }])
    expect(task.raw).toBe(raw)
  })

  it('兼容 size 与 state 字段', () => {
    const task = adaptGoed2kdTask({
      hash: VALID_HASH,
      size: 500,
      state: 'paused'
    })

    expect(task.totalLength).toBe(500)
    expect(task.status).toBe(TASK_STATUS.PAUSED)
    expect(task.name).toBe(VALID_HASH)
    expect(task.files).toEqual([])
    expect(task.dir).toBe('')
  })

  it('非法数值回退为 0', () => {
    const task = adaptGoed2kdTask({
      hash: VALID_HASH,
      total_done: 'bad',
      download_rate: null
    })

    expect(task.completedLength).toBe(0)
    expect(task.downloadSpeed).toBe(0)
    expect(task.progress).toBe(0)
  })
})

describe('adaptTaskForMainFlow', () => {
  it('按 engine 分发到对应适配器', () => {
    const aria2 = adaptTaskForMainFlow({ gid: 'g1', status: 'active' })
    expect(aria2.engine).toBe('aria2')

    const goed2kd = adaptTaskForMainFlow({
      engine: 'goed2kd',
      hash: VALID_HASH,
      status: 'complete'
    })
    expect(goed2kd.engine).toBe('goed2kd')
    expect(goed2kd.status).toBe(TASK_STATUS.COMPLETE)
  })
})

describe('getTaskDisplayName', () => {
  it('BT 任务显示 torrent 名称', () => {
    const name = getTaskDisplayName({
      files: [{ path: '/tmp/a.mkv' }],
      bittorrent: { info: { name: 'Season 1' } }
    })
    expect(name).toBe('Season 1')
  })

  it('goed2kd 任务显示 file_name', () => {
    const name = getTaskDisplayName({
      engine: 'goed2kd',
      file_name: 'demo.mkv',
      name: VALID_HASH
    })
    expect(name).toBe('demo.mkv')
  })

  it('无 task 时返回默认名称', () => {
    expect(getTaskDisplayName(null)).toBe('Unknown')
  })
})
