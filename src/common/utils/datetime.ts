import dayjs from "dayjs"

const INVALID_DATE = "-"

/** 格式化日期时间 */
export function formatDateTime(datetime: string | number | Date = "", template: string = "YYYY-MM-DD HH:mm:ss") {
  const day = dayjs(datetime)
  return day.isValid() ? day.format(template) : INVALID_DATE
}

/** 日期差异 */
export function dateDiff(start: string | number | Date, end: string | number | Date = new Date(), unit: dayjs.OpUnitType = "day") {
  const startDay = dayjs(start)
  const endDay = dayjs(end)
  return startDay.isValid() && endDay.isValid() ? endDay.diff(startDay, unit) : INVALID_DATE
}
