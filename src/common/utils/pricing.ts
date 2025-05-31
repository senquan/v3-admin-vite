import type { ProductListData } from "@/pages/product/apis/type"
import type { RuleListData, RulesWithPromotionType } from "@/pages/promotion/apis/type"
import { useSystemParamsStore } from "@/pinia/stores/system-params"

/**
 * 订单计价服务
 * 实现与后端相同的计价逻辑，用于前端本地计算
 */
const systemParamsStore = useSystemParamsStore()
const bonusSeriesIds = computed(() => systemParamsStore.getNumberArrayParam("bonus_series_ids"))

interface ProductWithQuantity extends ProductListData {
  quantity: number
}

let inited = false

// 存储所有促销规则
const rulesMap = new Map()

/**
 * 初始化促销规则数据
 * @param {Array<RulesWithPromotionType>} rules 从后端获取的促销规则
 */
export function initPromotionRules(rules: Array<RulesWithPromotionType>): void {
  rulesMap.clear()
  rules.forEach((rule) => {
    if (!rulesMap.has(rule.promotionType)) {
      rulesMap.set(rule.promotionType, [])
    }
    rulesMap.get(rule.promotionType).push(rule)
  })
  inited = true
  console.log("initPromotionRules", rulesMap)
}

/**
 * 计算订单价格
 * @param {object} params 计算参数
 * @param {Array<ProductWithQuantity>} params.products 产品列表，包含产品信息和数量
 * @returns {object} 计算结果
 */
export function calculateOrderPrice(params: { products: Array<ProductWithQuantity> }) {
  if (!inited) {
    console.warn("未初始化促销规则，无法计算价格")
    return {}
  }
  const { products } = params
  // 过滤有效产品并创建数量映射
  const validProducts = products.filter(p => p.quantity > 0 && p.id)
  const quantityMap = new Map(validProducts.map(p => [p.id, p.quantity]))

  const productMap = new Map() // 普通产品
  const bonusMap = new Map() // 赠品产品

  // 分类处理产品数据
  validProducts.forEach((product) => {
    const targetMap = bonusSeriesIds.value.includes(product.serie?.id) ? bonusMap : productMap
    const quantity = Number(quantityMap.get(product.id)) || 0

    targetMap.set(product.id, {
      ...product,
      quantity,
      unitPrice: product.basePrice,
      priceMap: new Map()
    })
  })

  // 计算订单总价
  let totalBasePrice = 0
  productMap.forEach((pwq) => {
    totalBasePrice += pwq.basePrice * pwq.quantity
  })
  totalBasePrice = Number(totalBasePrice.toFixed(2))

  // 按类型分组规则
  const resultMap = new Map()
  rulesMap.forEach((rules, promotionType) => {
    resultMap.set(promotionType, calculateDiscount(rules, productMap, promotionType))
  })
  const usedBonusPoint = calculateBonusPoint(bonusMap)

  // 计算价格和数量
  const productsArray = Array.from(productMap, ([id, data]) => ({
    id,
    unitPrice: data.unitPrice,
    quantity: data.quantity,
    priceMap: data.priceMap
  }))

  return {
    totalBasePrice,
    usedBonusPoint,
    products: productsArray,
    resultMap
  }
}

/**
 * 计算折扣
 * @param {Array} rules 规则列表
 * @param {Map} products 产品Map
 * @returns {object} 折扣结果
 */
function calculateDiscount(rules: Array<RuleListData>, products: any, type: number) {
  let totalDiscount = 0

  // 创建一个Map来跟踪每个产品的累计折扣和最终单价
  const productDiscounts = new Map()
  const matchLogs = new Map()

  // 遍历每条规则
  rules.forEach((rule) => {
    // 筛选符合条件的产品
    products.forEach((pwq: ProductWithQuantity) => {
      if (pwq != null && matchCondition(pwq, rule.condition)) {
        // console.log("matchCondition!!!!!!!!!!!")
        const productId = pwq.id
        const basePrice = Number(pwq.basePrice || 0)
        const currentDiscountValue = Number(rule.discountValue) // 当前规则的折扣值（百分比）
        const currentDiscount = basePrice * pwq.quantity * currentDiscountValue // 当前规则的折扣金额

        // 获取产品当前的累计折扣信息，如果不存在则初始化
        const discountInfo = productDiscounts.get(productId) || {
          totalDiscountValue: 0,
          totalDiscount: 0,
          finalUnitPrice: basePrice
        }

        const currentLog = matchLogs.get(productId) || []

        // 累加折扣值和折扣金额
        discountInfo.totalDiscountValue += currentDiscountValue
        discountInfo.totalDiscount += currentDiscount

        // 计算新的最终单价（考虑所有已应用的折扣）
        discountInfo.finalUnitPrice = basePrice * (1 - discountInfo.totalDiscountValue)

        // 更新产品的折扣信息
        productDiscounts.set(productId, discountInfo)

        // 记录匹配日志
        currentLog.push({
          productId,
          ruleId: rule.id,
          name: rule.name,
          value: rule.discountValue,
          discount: currentDiscount,
          pirce: basePrice * (1 - currentDiscountValue), // 单独应用此规则的价格
          stepPrice: basePrice * (1 - discountInfo.totalDiscountValue) // 应用所有已应用的折扣后的价格
        })
        matchLogs.set(productId, currentLog)
      }
    })
  })

  // 更新产品Map中的单价并计算总折扣
  productDiscounts.forEach((discountInfo, productId) => {
    totalDiscount += discountInfo.totalDiscount
    // 更新productMap中对应产品的unitPrice
    const product = products.get(productId)
    if (product) {
      // 更新productMap中对应产品的priceMap
      product.priceMap.set(type, {
        discount: Number(discountInfo.totalDiscount.toFixed(2)),
        price: Math.max(0, Number(discountInfo.finalUnitPrice.toFixed(2)))
      })
    }
  })

  return {
    discount: Number(totalDiscount.toFixed(2)),
    matchLogs
  }
}

/**
 * 条件匹配函数
 * @param {object} product 产品对象
 * @param {string} conditionStr 条件字符串
 * @returns {boolean} 是否匹配
 */
function matchCondition(product: ProductWithQuantity, conditionStr: string | object): boolean {
  // 处理特殊情况：如果conditionStr为空或undefined，直接返回true
  // 解析JSON字符串为对象
  const condition = typeof conditionStr === "string" ? JSON.parse(conditionStr) : conditionStr
  for (const [field, criteria] of Object.entries(condition)) {
    // 获取产品对应字段的值
    let productValue: any
    if (field === "totalBasePrice") {
      productValue = product.basePrice * product.quantity
    } else if (field === "totalProjectPrice") {
      productValue = product.projectPrice * product.quantity
    } else {
      productValue = product[field as keyof ProductWithQuantity]
    }

    // 如果是关联对象（如series, color等），获取其name属性
    if (field === "series") {
      productValue = product.serie?.name
    } else if (productValue && typeof productValue === "object") {
      if (field === "color") {
        productValue = productValue.value
      } else if ("name" in productValue) {
        productValue = productValue.name
      }
    }
    if (!productValue) productValue = ""
    // console.log("productValue", productValue)
    for (const [operator, values] of Object.entries(criteria as Record<string, unknown>)) {
      // console.log("operator", operator, values, typeof values)
      switch (operator) {
        case "equal":
          if (Array.isArray(values)) {
            if (!values.includes(productValue)) return false
          } else {
            if (productValue !== values) return false
          }
          break
        case "notEqual":
          if (Array.isArray(values)) {
            if (values.includes(productValue)) return false
          } else {
            if (productValue === values) return false
          }
          break
        case "in":
          if (!Array.isArray(values) || !values.includes(productValue)) return false
          break
        case "notIn":
          if (!Array.isArray(values) || values.includes(productValue)) return false
          break
        case "contains":
          if (typeof productValue !== "string") return false
          if (!Array.isArray(values) || !values.some((pattern: string) => {
            const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`)
            return regex.test(productValue)
          })) {
            return false
          }
          break
        case "greaterThanOrEqual":
          if (typeof values === "number" && Number(productValue) < values) return false
          break
        case "lessThanOrEqual":
          if (typeof values === "number" && Number(productValue) > values) return false
          break
        case "greaterThan":
          if (typeof values === "number" && Number(productValue) <= values) return false
          break
        case "lessThan":
          if (typeof values === "number" && Number(productValue) >= values) return false
          break
        case "like":
          if (typeof values === "number" && Number(productValue) >= values) return false
          break
      }
    }
  }
  return true
}

/**
 * 计算积分点数
 * @param {Map} bonusMap 积分产品Map
 * @returns {number} 使用的积分点数
 */
function calculateBonusPoint(bonusMap: Map<string, { quantity: number, modelType: { value: string } }>): number {
  let totalPoints = 0
  bonusMap.forEach((item) => {
    const factor = Number(item.modelType?.value) || 1
    totalPoints += item.quantity * factor
  })
  return totalPoints
}
