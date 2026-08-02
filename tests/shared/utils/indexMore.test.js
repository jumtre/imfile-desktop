import { describe, expect, it, vi } from 'vitest'

import {
  TASK_STATUS,
  UNKNOWN_PEERID,
  UNKNOWN_PEERID_NAME
} from '@shared/constants'
import {
  bitfieldToGraphic,
  buildFileList,
  buildMagnetLink,
  buildRpcUrl,
  calcFormLabelWidth,
  canUpdateTaskUri,
  changeKeysToKebabCase,
  checkIsNeedRestart,
  checkIsNeedRun,
  checkTaskIsBT,
  checkTaskIsSeeder,
  checkTaskTitleIsEmpty,
  cloneArray,
  compactUndefined,
  convertCommaToLine,
  convertLineToComma,
  detectResource,
  ellipsis,
  filterAudioFiles,
  filterDocumentFiles,
  filterImageFiles,
  filterVideoFiles,
  formatOptionsForEngine,
  generateRandomInt,
  getFileExtension,
  getFileName,
  getFileNameFromFile,
  getLangDirection,
  getTaskListDisplaySpeed,
  getTaskName,
  getTaskNumPieces,
  getTaskUri,
  getTaskUriLocation,
  intersection,
  isAudioOrVideo,
  isMagnetTask,
  isRTL,
  isTorrent,
  isTrackerSourceListChanged,
  listTorrentFiles,
  localeDateTimeFormat,
  mergeTaskResult,
  needCheckCopyright,
  normalizeTrackerSourceList,
  peerIdParser,
  pushItemToFixedLengthArray,
  removeArrayItem,
  removeExtensionDot,
  separateConfig,
  splitTextRows,
  timeRemaining
} from '@shared/utils/index'

const VALID_HASH = '0123456789abcdef0123456789abcdef01234567'

describe('bitfieldToGraphic', () => {
  it('将十六进制位域转为图形字符', () => {
    expect(bitfieldToGraphic('f')).toContain('█')
    expect(bitfieldToGraphic('0')).toContain('░')
  })
})

describe('peerIdParser', () => {
  it('未知 peerId 返回 unknown', () => {
    expect(peerIdParser(UNKNOWN_PEERID)).toBe(UNKNOWN_PEERID_NAME)
    expect(peerIdParser('')).toBe(UNKNOWN_PEERID_NAME)
  })
})

describe('timeRemaining', () => {
  it('按剩余字节与速度计算秒数', () => {
    expect(timeRemaining(1000, 200, 100)).toBe(8)
  })
})

describe('localeDateTimeFormat / ellipsis', () => {
  it('格式化时间戳', () => {
    const formatted = localeDateTimeFormat(1609459200, 'en-US')
    expect(formatted).toContain('2021')
  })

  it('空时间戳返回空字符串', () => {
    expect(localeDateTimeFormat(0, 'en-US')).toBe('')
  })

  it('超长字符串截断', () => {
    expect(ellipsis('hello world', 5)).toBe('hello...')
    expect(ellipsis('short', 10)).toBe('short')
  })
})

describe('getTaskName / getFileNameFromFile', () => {
  it('BT 任务优先使用 torrent 名称', () => {
    const name = getTaskName({
      files: [{ path: '/tmp/a.mkv' }],
      bittorrent: { info: { name: 'Season 1' } }
    })
    expect(name).toBe('Season 1')
  })

  it('单文件任务使用文件名', () => {
    const name = getTaskName({
      files: [{ path: '/downloads/movie.mkv' }]
    })
    expect(name).toBe('movie.mkv')
  })

  it('goed2kd 任务优先 file_name', () => {
    const name = getTaskName({
      engine: 'goed2kd',
      file_name: 'demo.mkv',
      name: VALID_HASH
    })
    expect(name).toBe('demo.mkv')
  })

  it('从 file.path 或 uris 提取文件名', () => {
    expect(getFileNameFromFile({ path: '/a/b/c.txt' })).toBe('c.txt')
    expect(getFileNameFromFile({ uris: [{ uri: 'https://x.com/file.zip' }] })).toBe('file.zip')
    expect(getFileNameFromFile(null)).toBe('')
  })
})

describe('任务类型与 URI 辅助', () => {
  it('识别磁力元数据任务', () => {
    expect(isMagnetTask({ bittorrent: {} })).toBe(true)
    expect(isMagnetTask({ bittorrent: { info: {} } })).toBe(false)
  })

  it('识别做种任务', () => {
    expect(checkTaskIsSeeder({ bittorrent: {}, seeder: 'true' })).toBe(true)
    expect(checkTaskIsSeeder({ bittorrent: {}, seeder: 'false' })).toBe(false)
  })

  it('列表速度列：做种用上传速度', () => {
    expect(getTaskListDisplaySpeed({
      status: TASK_STATUS.SEEDING,
      uploadSpeed: 100,
      downloadSpeed: 10
    })).toBe(100)
    expect(getTaskListDisplaySpeed({
      status: TASK_STATUS.ACTIVE,
      uploadSpeed: 100,
      downloadSpeed: 10
    })).toBe(10)
  })

  it('HTTP 任务可定位可更新 URI', () => {
    const task = {
      files: [{ uris: [{ uri: 'https://example.com/file.zip' }] }]
    }
    expect(getTaskUriLocation(task)).toEqual({
      fileIndex: 1,
      uri: 'https://example.com/file.zip'
    })
    expect(canUpdateTaskUri(task)).toBe(true)
    expect(getTaskUri(task)).toBe('https://example.com/file.zip')
  })

  it('goed2kd 任务返回 ed2k 链接', () => {
    const ed2k = 'ed2k://|file|a.mkv|1|ABCDEF0123456789ABCDEF0123456789|/'
    expect(getTaskUri({
      engine: 'goed2kd',
      ed2k_link: ed2k
    })).toBe(ed2k)
  })

  it('BT 任务构建磁力链接', () => {
    const magnet = buildMagnetLink({
      infoHash: VALID_HASH,
      bittorrent: {
        info: { name: 'demo' },
        announceList: [['udp://tracker.example.com:80']]
      }
    }, true, [])
    expect(magnet).toContain(`magnet:?xt=urn:btih:${VALID_HASH}`)
    expect(magnet).toContain('dn=demo')
    expect(magnet).toContain('tr=')
  })
})

describe('checkTaskTitleIsEmpty / checkTaskIsBT / getTaskNumPieces', () => {
  it('判断任务标题是否为空', () => {
    expect(checkTaskTitleIsEmpty({
      files: [{ path: '' }],
      bittorrent: { info: { name: 'x' } }
    })).toBe(false)
    expect(checkTaskTitleIsEmpty({
      files: [{ path: '' }]
    })).toBe(true)
  })

  it('识别 BT 任务并计算分片数', () => {
    const task = {
      bittorrent: {},
      numPieces: 16
    }
    expect(checkTaskIsBT(task)).toBe(true)
    expect(getTaskNumPieces(task)).toBe(16)
    expect(getTaskNumPieces({
      bittorrent: {},
      totalLength: 1000,
      pieceLength: 250
    })).toBe(4)
    expect(getTaskNumPieces({ files: [] })).toBeNull()
  })
})

describe('isTorrent / mergeTaskResult', () => {
  it('识别 torrent 文件', () => {
    expect(isTorrent({ name: 'a.torrent', type: '' })).toBe(true)
    expect(isTorrent({ name: 'a.bin', type: 'application/x-bittorrent' })).toBe(true)
    expect(isTorrent({ name: 'a.bin', type: '' })).toBe(false)
  })

  it('合并多组任务结果', () => {
    expect(mergeTaskResult([[{ id: 1 }], [{ id: 2 }]])).toEqual([{ id: 1 }, { id: 2 }])
  })
})

describe('配置与文本处理', () => {
  it('对象键名转 kebab-case', () => {
    expect(changeKeysToKebabCase({ maxConnections: '16' })).toEqual({
      'max-connections': '16'
    })
  })

  it('按 user/system/others 拆分配置', () => {
    const result = separateConfig({
      locale: 'zh-CN',
      'rpc-listen-port': 16800,
      custom: true
    })
    expect(result.user).toEqual({ locale: 'zh-CN' })
    expect(result.system).toEqual({ 'rpc-listen-port': 16800 })
    expect(result.others).toEqual({ custom: true })
  })

  it('splitTextRows 按真实换行拆分并 trim', () => {
    expect(splitTextRows('a\nb\nc')).toEqual(['a', 'b', 'c'])
    expect(splitTextRows('  a  \n  b  ')).toEqual(['a', 'b'])
  })

  it('逗号与换行互转', () => {
    expect(convertCommaToLine('a, b ,c')).toBe('a\nb\nc')
    expect(convertLineToComma('a\nb\nc')).toBe('a,b,c')
  })

  it('compactUndefined 过滤 undefined', () => {
    expect(compactUndefined([1, undefined, 2])).toEqual([1, 2])
  })
})

describe('文件过滤与资源检测', () => {
  it('按扩展名过滤媒体文件', () => {
    const files = [
      { extension: '.mp4' },
      { extension: '.mp3' },
      { extension: '.png' },
      { extension: '.pdf' }
    ]
    expect(filterVideoFiles(files)).toEqual([{ extension: '.mp4' }])
    expect(filterAudioFiles(files)).toEqual([{ extension: '.mp3' }])
    expect(filterImageFiles(files)).toEqual([{ extension: '.png' }])
    expect(filterDocumentFiles(files)).toEqual([{ extension: '.pdf' }])
  })

  it('检测音视频链接与版权提示', () => {
    expect(isAudioOrVideo('https://x.com/a.mp4')).toBe(true)
    expect(isAudioOrVideo('https://x.com/a.zip')).toBe(false)
    expect(needCheckCopyright('https://x.com/a.mp4\nhttps://x.com/b.zip')).toBe(true)
    expect(detectResource('magnet:?xt=urn:btih:abc')).toBe(true)
    expect(detectResource('plain text')).toBe(false)
  })
})

describe('路径与 tracker 列表', () => {
  it('提取文件名与扩展名', () => {
    expect(getFileName('/path/to/file.mkv')).toBe('file.mkv')
    expect(getFileExtension('movie.mkv')).toBe('mkv')
    expect(removeExtensionDot('.mkv')).toBe('mkv')
  })

  it('规范化 tracker 源列表并比较变更', () => {
    expect(normalizeTrackerSourceList([' b ', 'a', 1])).toEqual(['1', 'a', 'b'])
    expect(isTrackerSourceListChanged(['a', 'b'], ['b', 'a'])).toBe(false)
    expect(isTrackerSourceListChanged(['a'], ['a', 'b'])).toBe(true)
  })

  it('listTorrentFiles 补充 idx 与 extension', () => {
    const rows = listTorrentFiles([{ path: 'season/a.mkv' }])
    expect(rows[0]).toMatchObject({
      idx: 1,
      extension: '.mkv',
      path: 'season/a.mkv'
    })
  })
})

describe('表单与引擎配置', () => {
  it('德语表单标签更宽', () => {
    expect(calcFormLabelWidth('de-DE')).toBe('28%')
    expect(calcFormLabelWidth('zh-CN')).toBe('25%')
  })

  it('formatOptionsForEngine 转 kebab-case 并序列化数组', () => {
    expect(formatOptionsForEngine({
      maxConnections: 16,
      btTracker: ['udp://a.com', 'udp://b.com']
    })).toEqual({
      'max-connections': '16',
      'bt-tracker': 'udp://a.com\nudp://b.com'
    })
  })

  it('buildRpcUrl 拼接 token 与端口', () => {
    expect(buildRpcUrl({ port: 16800 })).toBe('http://127.0.0.1:16800/jsonrpc')
    expect(buildRpcUrl({ port: 16800, secret: 'abc' })).toBe('http://token:abc@127.0.0.1:16800/jsonrpc')
  })

  it('checkIsNeedRestart 识别需重启的配置项', () => {
    expect(checkIsNeedRestart({})).toBe(false)
    expect(checkIsNeedRestart({ rpcListenPort: 16801 })).toBe(true)
    expect(checkIsNeedRestart({ locale: 'en-US' })).toBe(false)
  })

  it('checkIsNeedRun 按间隔判断', () => {
    vi.useFakeTimers()
    vi.setSystemTime(10_000)
    expect(checkIsNeedRun(false, 0, 1000)).toBe(false)
    expect(checkIsNeedRun(true, 1000, 5000)).toBe(true)
    expect(checkIsNeedRun(true, 9000, 5000)).toBe(false)
    vi.useRealTimers()
  })
})

describe('数组与随机数工具', () => {
  it('generateRandomInt 落在范围内', () => {
    for (let i = 0; i < 20; i++) {
      const n = generateRandomInt(5, 10)
      expect(n).toBeGreaterThanOrEqual(5)
      expect(n).toBeLessThan(10)
    }
  })

  it('intersection / cloneArray / pushItemToFixedLengthArray / removeArrayItem', () => {
    expect(intersection([1, 2, 3], [2, 4])).toEqual([2])
    expect(cloneArray([1, 2], true)).toEqual([2, 1])
    expect(pushItemToFixedLengthArray([1, 2], 2, 3)).toEqual([2, 3])
    expect(removeArrayItem([1, 2, 3], 2)).toEqual([1, 3])
    expect(removeArrayItem([1, 2], 9)).toEqual([1, 2])
  })
})

describe('RTL 与 buildFileList', () => {
  it('识别 RTL 语言方向', () => {
    expect(isRTL('ar')).toBe(true)
    expect(isRTL('en-US')).toBe(false)
    expect(getLangDirection('ar')).toBe('rtl')
    expect(getLangDirection('en-US')).toBe('ltr')
  })

  it('buildFileList 包装上传文件对象', () => {
    const raw = { name: 'demo.torrent', size: 128 }
    const list = buildFileList(raw)
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({
      status: 'ready',
      name: 'demo.torrent',
      size: 128,
      raw
    })
    expect(raw.uid).toBeTypeOf('number')
  })
})

describe('getTaskName 边界', () => {
  it('无 task 时返回 defaultName', () => {
    expect(getTaskName(null, { defaultName: 'fallback' })).toBe('fallback')
  })
})
