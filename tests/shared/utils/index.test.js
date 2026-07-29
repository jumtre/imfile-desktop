import { describe, expect, it } from 'vitest'

import {
  APP_THEME,
  NONE_SELECTED_FILES,
  SELECTED_ALL_FILES,
  TASK_STATUS
} from '@shared/constants'
import {
  bitfieldToPercent,
  bytesToSize,
  calcProgress,
  calcRatio,
  changeKeysToCamelCase,
  decodeThunderLink,
  diffConfig,
  extractSpeedUnit,
  fixValue,
  getFileSelection,
  getInverseTheme,
  isTaskDownloading,
  isTaskFileEntrySelected,
  isUpdatableDownloadUri,
  normalizeTaskStatus,
  parseEd2kFileName,
  parseHeader,
  splitTaskLinks,
  timeFormat,
  validateNumber
} from '@shared/utils/index'

describe('bytesToSize', () => {
  it('格式化字节数为可读单位', () => {
    expect(bytesToSize(0)).toBe('0 KB')
    expect(bytesToSize(512)).toBe('512 B')
    expect(bytesToSize(1024)).toBe('1.0 KB')
    expect(bytesToSize(1536, 2)).toBe('1.50 KB')
    expect(bytesToSize(1048576)).toBe('1.0 MB')
  })

  it('对非法输入回退为 0 KB', () => {
    expect(bytesToSize('invalid')).toBe('0 KB')
    expect(bytesToSize(-100)).toBe('0 KB')
  })
})

describe('extractSpeedUnit', () => {
  it('从速度字符串提取单位', () => {
    expect(extractSpeedUnit('0')).toBe('K')
    expect(extractSpeedUnit('1.5M')).toBe('M')
    expect(extractSpeedUnit('1024K')).toBe('K')
    expect(extractSpeedUnit('invalid')).toBe('K')
  })
})

describe('bitfieldToPercent', () => {
  it('将十六进制位域转换为完成百分比', () => {
    expect(bitfieldToPercent('ffff')).toBe('100')
    expect(bitfieldToPercent('0000')).toBe('0')
  })
})

describe('calcProgress / calcRatio', () => {
  it('计算下载进度百分比', () => {
    expect(calcProgress(1000, 500)).toBe(50)
    expect(calcProgress(0, 100)).toBe(0)
    expect(calcProgress(1000, 0)).toBe(0)
  })

  it('计算上传比率', () => {
    expect(calcRatio(1000, 500)).toBe(0.5)
    expect(calcRatio(0, 100)).toBe(0)
  })
})

describe('normalizeTaskStatus', () => {
  it('统一各引擎任务状态字符串', () => {
    expect(normalizeTaskStatus('downloading')).toBe(TASK_STATUS.ACTIVE)
    expect(normalizeTaskStatus('queued')).toBe(TASK_STATUS.WAITING)
    expect(normalizeTaskStatus('pause')).toBe(TASK_STATUS.PAUSED)
    expect(normalizeTaskStatus('finished')).toBe(TASK_STATUS.COMPLETE)
    expect(normalizeTaskStatus('failed')).toBe(TASK_STATUS.ERROR)
    expect(normalizeTaskStatus('')).toBe(TASK_STATUS.WAITING)
  })
})

describe('isTaskDownloading', () => {
  it('已完成任务不在下载中', () => {
    expect(isTaskDownloading({ status: 'complete', totalLength: 100, completedLength: 100 })).toBe(false)
    expect(isTaskDownloading({ status: 'error' })).toBe(false)
  })

  it('元数据未就绪时仍视为下载中', () => {
    expect(isTaskDownloading({ status: 'active', totalLength: 0, completedLength: 0 })).toBe(true)
    expect(isTaskDownloading({ status: 'waiting', totalLength: 0 })).toBe(true)
  })

  it('按已完成字节判断下载中', () => {
    expect(isTaskDownloading({ status: 'active', totalLength: 1000, completedLength: 500 })).toBe(true)
    expect(isTaskDownloading({ status: 'active', totalLength: 1000, completedLength: 1000 })).toBe(false)
  })
})

describe('timeFormat', () => {
  it('格式化剩余时间', () => {
    expect(timeFormat(0, { i18n: {} })).toBe('')
    expect(timeFormat(90, { i18n: { second: 's', minute: 'm', hour: 'h', gt1d: '>1d' } })).toContain('1m')
    expect(timeFormat(90000, { i18n: { second: 's', minute: 'm', hour: 'h', gt1d: '>1d' } })).toContain('>1d')
  })
})

describe('parseEd2kFileName', () => {
  it('从标准 ed2k 链接解析文件名', () => {
    const link = 'ed2k://|file|test%20file.mkv|123456|ABCDEF0123456789ABCDEF0123456789|/'
    expect(parseEd2kFileName(link)).toBe('test file.mkv')
  })

  it('非法链接返回空字符串', () => {
    expect(parseEd2kFileName('')).toBe('')
    expect(parseEd2kFileName('http://example.com')).toBe('')
    expect(parseEd2kFileName('ed2k://|bad|link')).toBe('')
  })
})

describe('isTaskFileEntrySelected / getFileSelection', () => {
  it('兼容 aria2 小写 selected 与其它引擎 Selected 布尔', () => {
    expect(isTaskFileEntrySelected({ selected: 'true' })).toBe(true)
    expect(isTaskFileEntrySelected({ Selected: true })).toBe(true)
    expect(isTaskFileEntrySelected({ selected: 'false' })).toBe(false)
    expect(isTaskFileEntrySelected({})).toBe(false)
  })

  it('汇总文件选择状态', () => {
    expect(getFileSelection([])).toBe(NONE_SELECTED_FILES)
    expect(getFileSelection([{ selected: 'false' }])).toBe(NONE_SELECTED_FILES)
    expect(getFileSelection([{ selected: 'true' }, { selected: 'true' }])).toBe(SELECTED_ALL_FILES)
    expect(getFileSelection([{ selected: 'true' }, { selected: 'false' }])).toBe('0')
  })
})

describe('isUpdatableDownloadUri', () => {
  it('仅 HTTP/FTP 链接可更新', () => {
    expect(isUpdatableDownloadUri('https://example.com/file.zip')).toBe(true)
    expect(isUpdatableDownloadUri('ftp://example.com/file.zip')).toBe(true)
    expect(isUpdatableDownloadUri('magnet:?xt=urn:btih:abc')).toBe(false)
    expect(isUpdatableDownloadUri('')).toBe(false)
  })
})

describe('decodeThunderLink / splitTaskLinks', () => {
  it('解码迅雷链接', () => {
    const original = 'https://example.com/file.zip'
    const encoded = Buffer.from(`AA${original}ZZ`).toString('base64')
    expect(decodeThunderLink(`thunder://${encoded}`)).toBe(original)
    expect(decodeThunderLink('https://plain.url')).toBe('https://plain.url')
  })

  it('按行拆分并解码任务链接', () => {
    const links = 'https://a.com\nhttps://b.com'
    expect(splitTaskLinks(links)).toEqual(['https://a.com', 'https://b.com'])
  })
})

describe('changeKeysToCamelCase / fixValue', () => {
  it('对象键名转 camelCase', () => {
    expect(changeKeysToCamelCase({ 'user-agent': 'test', max_connections: '16' })).toEqual({
      userAgent: 'test',
      maxConnections: '16'
    })
  })

  it('将字符串布尔转为原生类型', () => {
    expect(fixValue({ enabled: 'true', disabled: 'false', name: 'foo' })).toEqual({
      enabled: true,
      disabled: false,
      name: 'foo'
    })
  })
})

describe('validateNumber', () => {
  it('校验有限数字', () => {
    expect(validateNumber(42)).toBe(true)
    expect(validateNumber('42')).toBe(false)
    expect(validateNumber(NaN)).toBe(false)
    expect(validateNumber(Infinity)).toBe(false)
  })
})

describe('parseHeader', () => {
  it('解析多行 HTTP 请求头', () => {
    const header = 'User-Agent: test\nReferer: https://example.com'
    expect(parseHeader(header)).toEqual({
      userAgent: 'test',
      referer: 'https://example.com'
    })
    expect(parseHeader('')).toEqual({})
  })
})

describe('diffConfig', () => {
  it('仅返回有变化的配置项', () => {
    const current = { a: 1, b: 2, c: [1, 2] }
    const next = { a: 1, b: 3, c: [1, 2] }
    expect(diffConfig(current, next)).toEqual({ b: 3 })
  })
})

describe('getInverseTheme', () => {
  it('在明暗主题间切换', () => {
    expect(getInverseTheme(APP_THEME.LIGHT)).toBe(APP_THEME.DARK)
    expect(getInverseTheme(APP_THEME.DARK)).toBe(APP_THEME.LIGHT)
  })
})
