/**
 * 格式化金额，添加千分位分隔符并保留两位小数
 * @param money 金额数字或字符串
 * @returns 格式化后的金额字符串
 *
 * @example
 * formattedMoney(1234.56) // "1,234.56"
 * formattedMoney(1234567.89) // "1,234,567.89"
 * formattedMoney(1000) // "1,000.00"
 * formattedMoney(0) // "0.00"
 * formattedMoney("1234.56") // "1,234.56"
 */
export function formattedMoney(money: number | string) {
  if (money === 0)
    return "0.00"
  if (!money)
    return ""
  const numValue = typeof money === "string" ? Number.parseFloat(money) : money
  return numValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function calculateSum(data: Record<string, number>[]): number {
  let total = 0
  for (const obj of data) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        total += obj[key]
      }
    }
  }
  return total
}

// 生成年份范围数组
export function range(start: number, diff: number) {
  const result = []
  for (let i = start; i >= start - diff; i--) {
    result.push(i)
  }
  return result
}
