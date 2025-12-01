import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import "dayjs/locale/zh-cn"

// 配置dayjs插件
dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale("zh-cn")

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式化模板，默认为 "YYYY-MM-DD HH:mm:ss"
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: string | Date | undefined | null, format = "YYYY-MM-DD HH:mm:ss"): string {
  if (!date) return "-"
  return dayjs(date).format(format)
}

/**
 * 格式化日期为相对时间
 * @param date 日期字符串或Date对象
 * @returns 相对时间字符串，如"2小时前"
 */
export function formatRelativeTime(date: string | Date | undefined | null): string {
  if (!date) return "-"
  return dayjs(date).fromNow()
}

/**
 * 格式化日期为简短格式
 * @param date 日期字符串或Date对象
 * @returns 简短格式的日期字符串，如"12-25 14:30"
 */
export function formatShortDate(date: string | Date | undefined | null): string {
  if (!date) return "-"
  const now = dayjs()
  const target = dayjs(date)

  // 如果是今年，不显示年份
  if (now.year() === target.year()) {
    return target.format("MM-DD HH:mm")
  }
  return target.format("YY-MM-DD HH:mm")
}

/**
 * 格式化x时x分x秒时间
 * @param seconds 秒数
 * @returns x时x分x秒
 */
export function formatPassedTime(seconds: number): string {
  const sec = seconds % 60
  const min = Math.floor(seconds / 60) % 60
  const hour = Math.floor(seconds / 3600)
  return `${hour}时${min}分${sec}秒`
};

/**
 * 格式化日期范围
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param format 格式化模板
 * @returns 格式化后的日期范围字符串
 */
export function formatDateRange(
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null,
  format = "YYYY-MM-DD HH:mm"
): string {
  const start = formatDate(startDate, format)
  const end = formatDate(endDate, format)

  if (start === "-" && end === "-") return "-"
  if (start === "-") return `至 ${end}`
  if (end === "-") return `${start} 起`

  return `${start} ~ ${end}`
}

/**
 * 判断日期是否为今天
 * @param date 日期字符串或Date对象
 * @returns 是否为今天
 */
export function isToday(date: string | Date | undefined | null): boolean {
  if (!date) return false
  return dayjs(date).isSame(dayjs(), "day")
}

/**
 * 判断日期是否为昨天
 * @param date 日期字符串或Date对象
 * @returns 是否为昨天
 */
export function isYesterday(date: string | Date | undefined | null): boolean {
  if (!date) return false
  return dayjs(date).isSame(dayjs().subtract(1, "day"), "day")
}

/**
 * 判断日期是否过期
 * @param date 日期字符串或Date对象
 * @returns 是否过期
 */
export function isExpired(date: string | Date | undefined | null): boolean {
  if (!date) return false
  return dayjs(date).isBefore(dayjs())
}

/**
 * 获取日期的开始时间（00:00:00）
 * @param date 日期字符串或Date对象
 * @returns 日期的开始时间
 */
export function getStartOfDay(date: string | Date | undefined | null): dayjs.Dayjs | null {
  if (!date) return null
  return dayjs(date).startOf("day")
}

/**
 * 获取日期的结束时间（23:59:59）
 * @param date 日期字符串或Date对象
 * @returns 日期的结束时间
 */
export function getEndOfDay(date: string | Date | undefined | null): dayjs.Dayjs | null {
  if (!date) return null
  return dayjs(date).endOf("day")
}

/**
 * 计算两个日期之间的天数差
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 天数差
 */
export function getDaysDiff(
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null
): number {
  if (!startDate || !endDate) return 0
  return dayjs(endDate).diff(dayjs(startDate), "day")
}

/**
 * 计算两个日期之间的秒差，并格式化为x时x分x秒输出
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 用时
 */
export function getTimeDiff(
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null
): string {
  if (!startDate || !endDate) return ""
  return formatPassedTime(dayjs(endDate).diff(dayjs(startDate), "second"))
};

/**
 * 获取当前时间戳
 * @returns 当前时间戳（毫秒）
 */
export function getCurrentTimestamp(): number {
  return dayjs().valueOf()
}

/**
 * 将时间戳转换为日期字符串
 * @param timestamp 时间戳（毫秒）
 * @param format 格式化模板
 * @returns 格式化后的日期字符串
 */
export function timestampToDate(timestamp: number, format = "YYYY-MM-DD HH:mm:ss"): string {
  return dayjs(timestamp).format(format)
}

/**
 * 将日期字符串转换为时间戳
 * @param date 日期字符串
 * @returns 时间戳（毫秒）
 */
export function dateToTimestamp(date: string | Date): number {
  return dayjs(date).valueOf()
}

export default {
  formatDate,
  formatRelativeTime,
  formatShortDate,
  formatDateRange,
  isToday,
  isYesterday,
  isExpired,
  getStartOfDay,
  getEndOfDay,
  getDaysDiff,
  getTimeDiff,
  getCurrentTimestamp,
  timestampToDate,
  dateToTimestamp
}
