import type { DiscountStrategy, PricingResult, ProductMatchCondition, ProductWithQuantity, PromotionRule, TieredReductionConfig } from "./pricing-types"
import { useSystemParamsStore } from "@/pinia/stores/system-params"

/**
 * 新一代价格计算引擎 V3  强规则引擎
 * 重构设计，支持强壮的规则JSON结构和灵活的折扣策略
 */

// ==================== 核心计算引擎 ====================

class PricingEngineV3 {
  private rules: PromotionRule[] = []
  private systemParamsStore = useSystemParamsStore()
  private bonusSeriesIds = computed(() => this.systemParamsStore.getNumberArrayParam("bonus_series_ids"))
  private usedBonusPoint = 0
  /**
   * 初始化规则
   */
  initRules(rules: PromotionRule[]): void {
    // 按优先级排序，优先级高的先执行
    this.rules = rules.sort((a, b) => b.priority - a.priority)
    console.log("PricingEngineV3 initialized with", this.rules.length, "rules")
  }

  /**
   * 计算订单价格
   */
  calculateOrderPrice(products: ProductWithQuantity[], type: number): PricingResult {
    // 过滤有效商品
    const validProducts = products.filter(p => p.quantity > 0 && p.id)

    const productMap = new Map() // 普通产品
    const bonusMap = new Map() // 赠品产品

    validProducts.forEach((product) => {
      const targetMap = this.bonusSeriesIds.value.includes(product.serie?.id || 0) ? bonusMap : productMap
      targetMap.set(product.id, product)
    })

    // 初始化结果
    const result: PricingResult = {
      originalTotalPrice: 0,
      totalDiscountAmount: 0,
      finalTotalPrice: 0,
      products: [],
      discountApplications: [],
      matchLogs: [],
      freeProducts: []
    }

    // 计算原始总价
    result.originalTotalPrice = Math.round(productMap.values().reduce(
      (sum, p) => sum + p.basePrice * p.quantity,
      0
    ) * 100) / 100

    // 初始化商品结果
    const productResults = new Map<number, {
      id: number
      quantity: number
      originalUnitPrice: number
      finalUnitPrice: number
      totalDiscount: number
      appliedRules: number[]
      isExclusive: boolean
    }>()

    productMap.values().forEach((product) => {
      productResults.set(product.id, {
        id: product.id,
        quantity: product.quantity,
        originalUnitPrice: product.basePrice,
        finalUnitPrice: product.basePrice,
        totalDiscount: 0,
        appliedRules: [],
        isExclusive: false
      })
    })

    // 按作用域和优先级应用规则
    this.applyRulesByScope(Array.from(productMap.values()), productResults, result, "product", type)
    this.applyRulesByScope(Array.from(productMap.values()), productResults, result, "order", type)
    this.applyRulesByScope(Array.from(productMap.values()), productResults, result, "global", type)

    // 汇总结果
    result.products = Array.from(productResults.values())
    result.totalDiscountAmount = result.products.reduce(
      (sum, p) => sum + p.totalDiscount,
      0
    )
    result.finalTotalPrice = result.originalTotalPrice - result.totalDiscountAmount
    this.usedBonusPoint = this.calculateBonusPoint(bonusMap)

    return result
  }

  /**
   * 按作用域应用规则
   */
  private applyRulesByScope(
    products: ProductWithQuantity[],
    productResults: Map<number, any>,
    result: PricingResult,
    scope: "product" | "order" | "global",
    type: number
  ): void {
    const scopeRules = this.rules.filter(rule => rule.scope === scope && rule.promotionType === type)
    for (const rule of scopeRules) {
      const matchLog = {
        ruleId: rule.id,
        ruleName: rule.name,
        matched: false,
        reason: "",
        appliedProducts: [] as number[]
      }

      try {
        if (scope === "product") {
          this.applyProductRule(rule, products, productResults, result, matchLog)
        } else if (scope === "order") {
          this.applyOrderRule(rule, products, productResults, result, matchLog)
        } else if (scope === "global") {
          this.applyGlobalRule(rule, products, productResults, result, matchLog)
        }
      } catch (error) {
        matchLog.reason = `规则应用失败: ${error}`
        console.error(`Rule ${rule.id} application failed:`, error)
      }

      result.matchLogs.push(matchLog)
    }
  }

  /**
   * 应用商品级规则
   */
  private applyProductRule(
    rule: PromotionRule,
    products: ProductWithQuantity[],
    productResults: Map<number, any>,
    result: PricingResult,
    matchLog: any
  ): void {
    const matchedProducts = products.filter(product =>
      this.matchProductConditions(product, rule.productConditions)
    )

    if (matchedProducts.length === 0) {
      matchLog.reason = "没有商品匹配条件"
      return
    }

    console.log("Product matchedProducts", matchedProducts)

    matchLog.matched = true
    matchLog.appliedProducts = matchedProducts.map(p => p.id)

    // 如果是阶梯满减，对整个匹配结果合计计算
    if (rule.discountStrategy.type === "tieredReduction") {
      const baseAmount = matchedProducts.reduce(
        (sum, p) => sum + p.basePrice * p.quantity,
        0
      )
      const baseQuantity = matchedProducts.reduce(
        (sum, p) => sum + p.quantity,
        0
      )
      const discountAmount = this.calculateTieredDiscount(rule.discountStrategy.tieredConfig!, baseAmount, baseQuantity)
      if (discountAmount > 0) {
        // 将满减额按比例分配到每个产品
        for (const product of matchedProducts) {
          const productResult = productResults.get(product.id)!
          const splitDiscountAmount = discountAmount * (product.basePrice * product.quantity / baseAmount)
          productResult.totalDiscount += splitDiscountAmount
          productResult.finalUnitPrice = Math.max(0, (product.basePrice * product.quantity - productResult.totalDiscount) / product.quantity)
          productResult.appliedRules.push(rule.id)

          // 记录折扣应用
          result.discountApplications.push({
            ruleId: rule.id,
            ruleName: rule.name,
            productId: product.id,
            originalPrice: product.basePrice * product.quantity,
            discountValue: discountAmount,
            discountAmount: splitDiscountAmount,
            finalPrice: productResult.finalUnitPrice * product.quantity,
            quantity: product.quantity,
            discountType: rule.discountStrategy.type
          })
        }
      }
    } else {
      for (const product of matchedProducts) {
        const productResult = productResults.get(product.id)!

        // 检查排他性
        if (productResult.isExclusive && !rule.exclusive) {
          continue // 已有排他规则，跳过非排他规则
        }

        if (rule.exclusive) {
          // 清除之前的折扣
          productResult.totalDiscount = 0
          productResult.appliedRules = []
          productResult.isExclusive = true
        }

        // 应用折扣
        const discountAmount = this.calculateDiscount(
          rule.discountStrategy,
          product,
          productResult
        )

        if (discountAmount > 0) {
          productResult.totalDiscount += discountAmount
          productResult.finalUnitPrice = Math.max(0, (product.basePrice * product.quantity - productResult.totalDiscount) / product.quantity)
          productResult.appliedRules.push(rule.id)

          // 记录折扣应用
          result.discountApplications.push({
            ruleId: rule.id,
            ruleName: rule.name,
            productId: product.id,
            originalPrice: product.basePrice * product.quantity,
            discountValue: rule.discountStrategy.type === "bundle" ? rule.discountStrategy.bundleConfig?.discountValue || 0 : rule.discountStrategy.value,
            discountAmount,
            finalPrice: productResult.finalUnitPrice * product.quantity,
            quantity: product.quantity,
            discountType: rule.discountStrategy.type
          })
        }
      }
    }
  }

  /**
   * 应用订单级规则
   */
  private applyOrderRule(
    rule: PromotionRule,
    products: ProductWithQuantity[],
    productResults: Map<number, any>,
    result: PricingResult,
    matchLog: any
  ): void {
    // 检查订单条件
    if (rule.orderConditions && !this.matchOrderConditions(products, rule.orderConditions)) {
      matchLog.reason = "订单条件不匹配"
      return
    }

    // 找到匹配的商品
    const matchedProducts = products.filter(product =>
      this.matchProductConditions(product, rule.productConditions)
    )

    console.log("Order matchedProducts", matchedProducts)

    if (matchedProducts.length === 0) {
      matchLog.reason = "没有商品匹配条件"
      return
    }

    matchLog.matched = true
    matchLog.appliedProducts = matchedProducts.map(p => p.id)

    // 应用订单级折扣（如阶梯满减）
    this.applyOrderLevelDiscount(rule, matchedProducts, productResults, result)
  }

  /**
   * 应用全局规则
   */
  private applyGlobalRule(
    rule: PromotionRule,
    products: ProductWithQuantity[],
    productResults: Map<number, any>,
    result: PricingResult,
    matchLog: any
  ): void {
    // 全局规则应用到所有商品
    const totalAmount = Array.from(productResults.values()).reduce(
      (sum, p) => sum + p.finalUnitPrice * p.quantity,
      0
    )

    // 检查全局条件
    if (rule.orderConditions) {
      const orderConditions = {
        totalAmount: { greaterThanOrEqual: totalAmount },
        ...rule.orderConditions
      }

      if (!this.matchOrderConditions(products, orderConditions)) {
        matchLog.reason = "全局条件不匹配"
        return
      }
    }

    matchLog.matched = true
    matchLog.appliedProducts = products.map(p => p.id)

    // 应用全局折扣
    this.applyGlobalDiscount(rule, products, productResults, result, totalAmount)
  }

  /**
   * 计算单个商品折扣
   */
  private calculateDiscount(
    strategy: DiscountStrategy,
    product: ProductWithQuantity,
    _productResult: any
  ): number {
    const baseAmount = product.basePrice * product.quantity

    switch (strategy.type) {
      case "percentage":
        return Math.min(
          baseAmount * (strategy.value / 100),
          strategy.maxDiscount || Infinity
        )
      case "fixed":
        return Math.min(strategy.value, baseAmount)
      case "specialPrice":
        return Math.max(0, baseAmount - strategy.value * product.quantity)
      default:
        return 0
    }
  }

  /**
   * 计算阶梯折扣
   */
  private calculateTieredDiscount(config: TieredReductionConfig, amount: number, quantity: number): number {
    const applicableTier = config.tiers
      .filter(tier => tier.subjectType === "quantity" ? quantity >= tier.threshold : amount >= tier.threshold)
      .sort((a, b) => b.threshold - a.threshold)[0]

    if (!applicableTier) return 0

    const subjectValue = applicableTier.subjectType === "quantity" ? quantity : amount

    const discount = applicableTier.discountType === "every"
      ? applicableTier.discount * Math.floor(subjectValue / (applicableTier.every || 1))
      : (applicableTier.discountType === "percentage" ? amount * (applicableTier.discount / 100) : applicableTier.discount)

    return Math.min(discount, config.maxDiscount || Infinity)
  }

  /**
   * 应用订单级折扣
   */
  private applyOrderLevelDiscount(
    rule: PromotionRule,
    products: ProductWithQuantity[],
    productResults: Map<number, any>,
    result: PricingResult
  ): void {
    const totalAmount = products.reduce((sum, p) => sum + p.basePrice * p.quantity, 0)
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0)

    if (rule.discountStrategy.type === "tieredReduction") {
      const totalDiscount = this.calculateTieredDiscount(
        rule.discountStrategy.tieredConfig!,
        totalAmount,
        totalQuantity
      )

      if (totalDiscount > 0) {
        // 按比例分配折扣到各个商品
        this.distributeDiscount(products, productResults, totalDiscount, rule, result)
      }
    }
  }

  /**
   * 应用全局折扣
   */
  private applyGlobalDiscount(
    rule: PromotionRule,
    products: ProductWithQuantity[],
    productResults: Map<number, any>,
    result: PricingResult,
    totalAmount: number
  ): void {
    const globalDiscount = this.calculateDiscount(
      rule.discountStrategy,
      { basePrice: totalAmount, quantity: 1 } as any,
      null
    )

    if (globalDiscount > 0) {
      this.distributeDiscount(products, productResults, globalDiscount, rule, result)
    }
  }

  /**
   * 分配折扣到商品
   */
  private distributeDiscount(
    products: ProductWithQuantity[],
    productResults: Map<number, any>,
    totalDiscount: number,
    rule: PromotionRule,
    result: PricingResult
  ): void {
    const totalAmount = products.reduce((sum, p) => sum + p.basePrice * p.quantity, 0)

    for (const product of products) {
      const productResult = productResults.get(product.id)!
      const productAmount = product.basePrice * product.quantity
      const proportion = productAmount / totalAmount
      const productDiscount = totalDiscount * proportion

      productResult.totalDiscount += productDiscount
      productResult.finalUnitPrice = Math.max(0, (productAmount - productResult.totalDiscount) / product.quantity)
      productResult.appliedRules.push(rule.id)

      result.discountApplications.push({
        ruleId: rule.id,
        ruleName: rule.name,
        productId: product.id,
        originalPrice: productAmount,
        discountValue: totalDiscount,
        discountAmount: productDiscount,
        finalPrice: productResult.finalUnitPrice * product.quantity,
        quantity: product.quantity,
        discountType: rule.discountStrategy.type
      })
    }
  }

  /**
   * 匹配商品条件
   */
  private matchProductConditions(
    product: ProductWithQuantity,
    conditions: ProductMatchCondition
  ): boolean {
    for (const [field, condition] of Object.entries(conditions)) {
      if (!this.matchFieldCondition(product, field, condition)) {
        return false
      }
    }
    return true
  }

  /**
   * 匹配订单条件
   */
  private matchOrderConditions(
    products: ProductWithQuantity[],
    conditions: any
  ): boolean {
    const orderData = {
      totalAmount: products.reduce((sum, p) => sum + p.basePrice * p.quantity, 0),
      totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
      productCount: products.length
    }

    for (const [field, condition] of Object.entries(conditions)) {
      if (!this.matchFieldCondition(orderData, field, condition)) {
        return false
      }
    }
    return true
  }

  /**
   * 匹配字段条件
   */
  private matchFieldCondition(target: any, field: string, condition: any): boolean {
    const value = this.getFieldValue(target, field)
    for (const [operator, operatorValue] of Object.entries(condition)) {
      if (!this.evaluateOperator(value, operator, operatorValue)) {
        return false
      }
    }
    return true
  }

  /**
   * 获取字段值
   */
  private getFieldValue(target: any, field: string): any {
    if (field === "totalBasePrice") {
      return target.basePrice * target.quantity
    }
    if (field === "totalProjectPrice") {
      return (target.projectPrice || target.basePrice) * target.quantity
    }
    if (field === "series") {
      return target.serie?.name || ""
    }
    if (field === "color") {
      return target.color?.value || target.color?.name || ""
    }
    if (field === "modelType") {
      return target.modelType?.name || ""
    }

    const value = target[field]
    if (value && typeof value === "object" && "name" in value) {
      return value.name
    }
    return value || ""
  }

  /**
   * 评估操作符
   */
  private evaluateOperator(value: any, operator: string, operatorValue: any): boolean {
    switch (operator) {
      case "equal":
        return Array.isArray(operatorValue)
          ? operatorValue.includes(value)
          : value === operatorValue

      case "notEqual":
        return Array.isArray(operatorValue)
          ? !operatorValue.includes(value)
          : value !== operatorValue

      case "in":
        return Array.isArray(operatorValue) && operatorValue.includes(value)

      case "notIn":
        return !Array.isArray(operatorValue) || !operatorValue.includes(value)

      case "contains":
        if (typeof value !== "string") return false
        return Array.isArray(operatorValue) && operatorValue.some((pattern: string) => {
          const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`)
          return regex.test(value)
        })

      case "greaterThan":
        return Number(value) > Number(operatorValue)

      case "greaterThanOrEqual":
        return Number(value) >= Number(operatorValue)

      case "lessThan":
        return Number(value) < Number(operatorValue)

      case "lessThanOrEqual":
        return Number(value) <= Number(operatorValue)

      case "like":
        if (typeof value !== "string") return false
        return Array.isArray(operatorValue) && operatorValue.some((pattern: string) =>
          value.toLowerCase().includes(pattern.toLowerCase())
        )

      default:
        return true
    }
  }

  /**
   * 计算积分点数
   * @param {Map} bonusMap 积分产品Map
   * @returns {number} 使用的积分点数
   */
  private calculateBonusPoint(bonusMap: Map<string, { quantity: number, modelType: { value: string } }>): number {
    let totalPoints = 0
    bonusMap.forEach((item) => {
      const factor = Number(item.modelType?.value) || 0
      totalPoints += item.quantity * factor
    })
    return totalPoints
  }

  getUsedBonusPoint(): number {
    return pricingEngine.usedBonusPoint
  }
}

// ==================== 导出接口 ====================

// 创建全局实例
const pricingEngine = new PricingEngineV3()

/**
 * 初始化促销规则
 */
export function initPromotionRulesV3(rules: PromotionRule[]): void {
  pricingEngine.initRules(rules)
}

/**
 * 计算订单价格
 */
export function calculateOrderPriceV3(products: ProductWithQuantity[], type: number): PricingResult {
  return pricingEngine.calculateOrderPrice(products, type)
}

export function getUsedBonusPointV3(): number {
  return pricingEngine.getUsedBonusPoint()
}
