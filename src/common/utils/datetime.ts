import dayjs from "dayjs"

const INVALID_DATE = "N/A"

/** 格式化日期时间 */
export function formatDateTime(datetime: string | number | Date = "", template: string = "YYYY-MM-DD HH:mm:ss") {
  const day = dayjs(datetime)
  return day.isValid() ? day.format(template) : INVALID_DATE
}

export function addDate(datetime: string | number | Date = "", nums: number, unit?: dayjs.ManipulateType): Date {
  const day = dayjs(datetime)
  return day.add(nums, unit).toDate()
}

/**
 * 日期时间格式化
 * @param time 时间对象或时间戳
 * @param cFormat 格式化模板，默认为 {y}-{m}-{d} {h}:{i}:{s}
 * @returns 格式化后的时间字符串
 */
export function parseTime(time: Date | string | number, cFormat?: string): string | null {
  if (arguments.length === 0) {
    return null
  }

  const format = cFormat || "{y}-{m}-{d} {h}:{i}:{s}"
  let date: Date

  if (typeof time === "object") {
    date = time as Date
  } else {
    if (typeof time === "string" && /^\d+$/.test(time)) {
      time = Number.parseInt(time)
    }

    if (typeof time === "number" && time.toString().length === 10) {
      time = time * 1000
    }

    date = new Date(time)
  }

  const formatObj: Record<string, number> = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }

  const timeStr = format.replace(/\{([ymdhisa])+\}/g, (result, key) => {
    const value = formatObj[key]
    // 注意: getDay() 返回 0 表示周日
    if (key === "a") {
      return ["日", "一", "二", "三", "四", "五", "六"][value]
    }
    let numString: string = value.toString()
    if (result.length > 0 && value < 10) {
      numString = `0${value}`
    }
    return numString
  })

  return timeStr
}

/**
 * 格式化时间为相对时间
 * @param time 时间戳
 * @param option 格式化选项
 * @returns 格式化后的相对时间字符串
 */
export function formatTime(time: number, option?: string): string {
  time = time * 1000
  const d = new Date(time)
  const now = Date.now()

  const diff = (now - d.getTime()) / 1000

  if (diff < 30) {
    return "刚刚"
  } else if (diff < 3600) {
    // 小于1小时
    return `${Math.ceil(diff / 60)}分钟前`
  } else if (diff < 3600 * 24) {
    return `${Math.ceil(diff / 3600)}小时前`
  } else if (diff < 3600 * 24 * 2) {
    return "1天前"
  }

  if (option) {
    return parseTime(time, option) || ""
  } else {
    return `${d.getMonth() + 1}月${d.getDate()}日${d.getHours()}时${d.getMinutes()}分`
  }
}

/**
 * 获取上一个月的日期范围
 * @param timestr 时间字符串，格式为 yyyy-mm-dd
 * @param num 月份偏移量
 * @returns 日期范围数组 [开始日期, 结束日期]
 */
export function getPrevMonth(timestr?: string, num: number = -1): [string, string] {
  let year: number, month: number

  if (timestr) {
    const ma = timestr.match(/(\d{4})-(\d+)-(\d+)/)
    if (ma) {
      year = Number.parseInt(ma[1])
      month = Number.parseInt(ma[2])
    } else {
      const d = new Date()
      year = d.getFullYear()
      month = d.getMonth() + 1
    }
  } else {
    const d = new Date()
    year = d.getFullYear()
    month = d.getMonth() + 1
  }

  let y = year
  let m = month + num

  if (m === 0) {
    y = year - 1
    m = 12
  } else if (m < 0) {
    y = year + Math.floor((month + num - 1) / 12)
    m = ((month + num - 1) % 12) + 1
    if (m < 0) m += 12
  } else if (m > 12) {
    y = year + Math.floor((month + num - 1) / 12)
    m = ((month + num - 1) % 12) + 1
  }

  // 获取月份的最后一天
  const _start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0)
  const days = end.getDate()

  const mStr = m < 10 ? `0${m}` : `${m}`

  return [`${y}-${mStr}-01`, `${y}-${mStr}-${days}`]
}

/**
 * 判断给定时间是否时过去的月份
 * @param timestr 时间字符串，格式为 yyyy-mm-dd
 * @returns 是否是过去的月份
 */
export function isPastMonth(timestr?: string, _num: number = -1): boolean {
  let targetDate: Date

  if (timestr) {
    targetDate = new Date(timestr)
  } else {
    return false
  }

  const now = new Date()
  const compareDate = new Date(now.getFullYear(), now.getMonth(), 1)
  return targetDate < compareDate
}

/**
 * 获取两个日期之间的差值
 * @param start 开始日期
 * @param end 结束日期
 * @param format 返回格式 (s:秒, m:分钟, h:小时, d:天)
 * @returns 差值
 */
export function getDateDiff(start: string, end: string, format: string): number {
  if (!start) {
    start = parseTime(new Date(), "{y}/{m}/{d}") || ""
  } else {
    start = start.replace(/-/g, "/")
  }

  if (!end.includes("T")) {
    end = end.replace(/-/g, "/")
  }
  format = format.toLowerCase()

  const sTime = new Date(start)
  const eTime = new Date(end)
  let timeNum = 1

  switch (format) {
    case "s":
      timeNum = 1000
      break
    case "m":
      timeNum = 1000 * 60
      break
    case "h":
      timeNum = 1000 * 3600
      break
    case "d":
      timeNum = 1000 * 3600 * 24
      break
    default:
      break
  }

  return Math.floor((eTime.getTime() - sTime.getTime()) / timeNum)
}

/**
 * 日期选择器选项
 */
export const pickerOptions = [
  {
    text: "今天",
    onClick(picker: any) {
      const end = new Date()
      const start = new Date(new Date().toDateString())
      end.setTime(start.getTime())
      picker.$emit("pick", [start, end])
    }
  },
  {
    text: "最近一周",
    onClick(picker: any) {
      const end = new Date(new Date().toDateString())
      const start = new Date()
      start.setTime(end.getTime() - 3600 * 1000 * 24 * 7)
      picker.$emit("pick", [start, end])
    }
  },
  {
    text: "最近一个月",
    onClick(picker: any) {
      const end = new Date(new Date().toDateString())
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      picker.$emit("pick", [start, end])
    }
  },
  {
    text: "最近三个月",
    onClick(picker: any) {
      const end = new Date(new Date().toDateString())
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      picker.$emit("pick", [start, end])
    }
  }
]

/**
 * 获取时间戳
 * @param type 类型，start表示90天前，其他表示今天
 * @returns 时间戳
 */
export function getTime(type: string): number {
  if (type === "start") {
    return new Date().getTime() - 3600 * 1000 * 24 * 90
  } else {
    return new Date(new Date().toDateString()).getTime()
  }
}
