import type {
  BundleConfig,
  BuyXGetYConfig,
  DiscountStrategy,
  OperatorCondition,
  PromotionRule,
  TieredReductionConfig
} from "./pricing-types"

/**
 * 促销规则构建器
 * 提供链式API来构建复杂的促销规则
 */

export class RuleBuilder {
  private rule: Partial<PromotionRule> = {
    productConditions: {},
    discountStrategy: { type: "fixed", value: 0 }
  }

  private conditionsUseArrayValue: string[] = ["in", "notIn", "contains", "notContains"]

  /**
   * 设置规则基础信息
   */
  setBasicInfo(id: number, name: string, description?: string): RuleBuilder {
    this.rule.id = id
    this.rule.name = name
    this.rule.description = description
    return this
  }

  /**
   * 设置优先级
   */
  setPriority(priority: number): RuleBuilder {
    this.rule.priority = priority
    return this
  }

  /**
   * 设置作用域
   */
  setScope(scope: "product" | "order" | "global"): RuleBuilder {
    this.rule.scope = scope
    return this
  }

  /**
   * 设置排他性
   */
  setExclusive(exclusive: boolean = true): RuleBuilder {
    this.rule.exclusive = exclusive
    return this
  }

  /**
   * 设置时间范围
   */
  setTimeRange(startTime: string, endTime: string): RuleBuilder {
    this.rule.startTime = startTime
    this.rule.endTime = endTime
    return this
  }

  /**
   * 添加商品ID条件
   */
  matchProductIds(ids: number[], operator: "in" | "notIn" = "in"): RuleBuilder {
    this.matchCustomField("id", { [operator]: ids })
    return this
  }

  /**
   * 添加系列条件
   */
  matchSeries(series: string[], operator: "equal" | "in" | "notIn" = "in"): RuleBuilder {
    this.matchCustomField("series", { [operator]: series })
    return this
  }

  /**
   * 添加颜色条件
   */
  matchColors(colors: string[], operator: "equal" | "in" | "notIn" | "contains" = "in"): RuleBuilder {
    this.matchCustomField("color", { [operator]: colors })
    return this
  }

  /**
   * 添加价格条件
   */
  matchPriceRange(min?: number, max?: number, field: "basePrice" | "projectPrice" = "basePrice"): RuleBuilder {
    if (!this.rule.productConditions) this.rule.productConditions = {}
    const condition: OperatorCondition<number> = {}

    if (min !== undefined) {
      condition.greaterThanOrEqual = min
    }
    if (max !== undefined) {
      condition.lessThanOrEqual = max
    }

    this.rule.productConditions[field] = condition
    return this
  }

  /**
   * 添加数量条件
   */
  matchQuantity(min?: number, max?: number): RuleBuilder {
    if (!this.rule.productConditions) this.rule.productConditions = {}
    const condition: OperatorCondition<number> = {}

    if (min !== undefined) {
      condition.greaterThanOrEqual = min
    }
    if (max !== undefined) {
      condition.lessThanOrEqual = max
    }

    this.rule.productConditions.quantity = condition
    return this
  }

  /**
   * 添加类别条件
   */
  matchCategories(categories: string[], operator: "in" | "notIn" = "in"): RuleBuilder {
    if (!this.rule.productConditions) this.rule.productConditions = {}
    this.rule.productConditions.category = { [operator]: categories }
    return this
  }

  /**
   * 添加自定义条件
   */
  matchCustomField(field: string, condition: OperatorCondition<any>): RuleBuilder {
    if (!this.rule.productConditions) this.rule.productConditions = {}
    if (!this.rule.productConditions[field]) {
      this.rule.productConditions[field] = {}
    }
    // console.log("Add custom field:", field, condition)
    // 合并条件，保留原有属性
    Object.assign(this.rule.productConditions[field], condition)
    return this
  }

  /**
   * 批量设置订单条件
   * 通用的条件设置
   */
  setOrderConditions(conditions: any): RuleBuilder {
    if (!this.rule.orderConditions) this.rule.orderConditions = {}
    // 处理从表单传来的条件格式: { attr: { operator: value } }
    Object.entries(conditions).forEach(([attr, conditionMap]) => {
      Object.entries(conditionMap as any).forEach(([operator, value]) => {
        switch (attr) {
          case "totalAmount":
          case "totalQuantity":
          case "productCount":
            if (!this.rule.orderConditions![attr]) {
              this.rule.orderConditions![attr] = {}
            }
            (this.rule.orderConditions![attr] as any)[operator] = value
            break
        }
      })
    })
    return this
  }

  /**
   * 设置单个订单条件（用于链式调用）
   * 简化的范围条件设置
   */
  setOrderCondition(conditions: {
    totalAmount?: { min?: number, max?: number }
    totalQuantity?: { min?: number, max?: number }
    productCount?: { min?: number, max?: number }
  }): RuleBuilder {
    const convertedConditions: any = {}
    Object.entries(conditions).forEach(([key, value]) => {
      if (value) {
        convertedConditions[key] = {}
        if (value.min !== undefined) {
          convertedConditions[key].greaterThanOrEqual = value.min
        }
        if (value.max !== undefined) {
          convertedConditions[key].lessThanOrEqual = value.max
        }
      }
    })

    return this.setOrderConditions(convertedConditions)
  }

  /**
   * 设置商品条件
   */
  setProductConditions(conditions: any): RuleBuilder {
    if (!this.rule.productConditions) this.rule.productConditions = {}

    // 处理从表单传来的条件格式: { attr: { operator: value } }
    Object.entries(conditions).forEach(([attr, conditionMap]) => {
      Object.entries(conditionMap as any).forEach(([operator, value]) => {
        switch (attr) {
          case "basePrice":
          case "projectPrice":
          case "quantity":
            if (!this.rule.productConditions![attr]) {
              this.rule.productConditions![attr] = {}
            }
            (this.rule.productConditions![attr] as any)[operator] = value
            break
          default:
            // 处理其他自定义字段
            if (this.conditionsUseArrayValue.includes(operator)) {
              this.matchCustomField(attr, { [operator]: String(value).split(",") })
            } else {
              this.matchCustomField(attr, { [operator]: value })
            }
            break
        }
      })
    })
    // console.log("this.rule.productConditions", this.rule.productConditions)
    return this
  }

  /**
   * 设置百分比折扣
   */
  setPercentageDiscount(percentage: number, maxDiscount?: number): RuleBuilder {
    this.rule.discountStrategy = {
      type: "percentage",
      value: percentage,
      maxDiscount
    }
    return this
  }

  /**
   * 设置固定金额折扣
   */
  setFixedDiscount(amount: number): RuleBuilder {
    this.rule.discountStrategy = {
      type: "fixed",
      value: amount
    }
    return this
  }

  /**
   * 设置特价
   */
  setSpecialPrice(price: number): RuleBuilder {
    this.rule.discountStrategy = {
      type: "specialPrice",
      value: price
    }
    return this
  }

  /**
   * 设置阶梯满减
   */
  setTieredReduction(config: TieredReductionConfig): RuleBuilder {
    this.rule.discountStrategy = {
      type: "tieredReduction",
      value: 0,
      tieredConfig: config
    }
    return this
  }

  /**
   * 设置买X送Y
   */
  setBuyXGetY(config: BuyXGetYConfig): RuleBuilder {
    this.rule.discountStrategy = {
      type: "buyXGetY",
      value: 0,
      buyXGetYConfig: config
    }
    return this
  }

  /**
   * 设置套装优惠
   */
  setBundleDiscount(config: BundleConfig): RuleBuilder {
    this.rule.discountStrategy = {
      type: "bundle",
      value: 0,
      bundleConfig: config
    }
    return this
  }

  /**
   * 添加标签
   */
  addTags(...tags: string[]): RuleBuilder {
    if (!this.rule.tags) this.rule.tags = []
    this.rule.tags.push(...tags)
    return this
  }

  /**
   * 设置元数据
   */
  setMetadata(metadata: Record<string, any>): RuleBuilder {
    this.rule.metadata = { ...this.rule.metadata, ...metadata }
    return this
  }

  /**
   * 构建规则
   */
  build(): PromotionRule {
    // 验证必填字段
    if (!this.rule.name) {
      throw new Error("规则名称是必填的")
    }
    if (!this.rule.scope) {
      throw new Error("规则作用域是必填的")
    }
    if (this.rule.priority === undefined) {
      throw new Error("规则优先级是必填的")
    }
    if (this.rule.exclusive === undefined) {
      throw new Error("规则排他性是必填的")
    }
    return this.rule as PromotionRule
  }

  /**
   * 输出JSON格式的规则
   */
  toJSON(): string {
    const rule = this.build()
    return JSON.stringify(rule, null, 2)
  }

  /**
   * 输出压缩的JSON格式规则
   */
  toCompactJSON(): string {
    const rule = this.build()
    return JSON.stringify(rule)
  }

  /**
   * 获取当前规则的JSON对象（不进行验证）
   */
  getRuleJSON(): object {
    return JSON.parse(JSON.stringify(this.rule))
  }

  /**
   * 重置构建器
   */
  reset(): RuleBuilder {
    this.rule = {
      productConditions: {},
      discountStrategy: { type: "fixed", value: 0 }
    }
    return this
  }

  /**
   * 克隆当前规则
   */
  clone(): RuleBuilder {
    const newBuilder = new RuleBuilder()
    newBuilder.rule = JSON.parse(JSON.stringify(this.rule))
    return newBuilder
  }
}

// ==================== 预设规则模板 ====================

/**
 * 预设规则模板
 */
export class RuleTemplates {
  /**
   * 创建系列折扣规则
   */
  static createSeriesDiscount(
    id: number,
    name: string,
    series: string[],
    discountPercentage: number,
    priority: number = 100
  ): PromotionRule {
    return new RuleBuilder()
      .setBasicInfo(id, name)
      .setPriority(priority)
      .setScope("product")
      .setExclusive(false)
      .matchSeries(series)
      .setPercentageDiscount(discountPercentage)
      .build()
  }

  /**
   * 创建满减规则
   */
  static createFullReduction(
    id: number,
    name: string,
    tiers: Array<{ threshold: number, discount: number }>,
    priority: number = 80
  ): PromotionRule {
    return new RuleBuilder()
      .setBasicInfo(id, name)
      .setPriority(priority)
      .setScope("order")
      .setExclusive(false)
      .setTieredReduction({ tiers })
      .build()
  }

  /**
   * 创建特价商品规则
   */
  static createSpecialPrice(
    id: number,
    name: string,
    productIds: number[],
    specialPrice: number,
    priority: number = 200
  ): PromotionRule {
    return new RuleBuilder()
      .setBasicInfo(id, name)
      .setPriority(priority)
      .setScope("product")
      .setExclusive(true)
      .matchProductIds(productIds)
      .setSpecialPrice(specialPrice)
      .build()
  }

  /**
   * 创建新用户首单优惠
   */
  static createFirstOrderDiscount(
    id: number,
    name: string,
    discountPercentage: number,
    maxDiscount: number,
    priority: number = 150
  ): PromotionRule {
    return new RuleBuilder()
      .setBasicInfo(id, name)
      .setPriority(priority)
      .setScope("global")
      .setExclusive(false)
      .setPercentageDiscount(discountPercentage, maxDiscount)
      .addTags("新用户", "首单")
      .setMetadata({ userType: "new", orderType: "first" })
      .build()
  }

  /**
   * 创建限时抢购规则
   */
  static createFlashSale(
    id: number,
    name: string,
    productIds: number[],
    discountPercentage: number,
    startTime: string,
    endTime: string,
    priority: number = 300
  ): PromotionRule {
    return new RuleBuilder()
      .setBasicInfo(id, name)
      .setPriority(priority)
      .setScope("product")
      .setExclusive(true)
      .setTimeRange(startTime, endTime)
      .matchProductIds(productIds)
      .setPercentageDiscount(discountPercentage)
      .addTags("限时", "抢购")
      .setMetadata({ campaign: "flash_sale" })
      .build()
  }

  /**
   * 创建买二送一规则
   */
  static createBuy2Get1Free(
    id: number,
    name: string,
    productIds?: number[],
    priority: number = 120
  ): PromotionRule {
    const builder = new RuleBuilder()
      .setBasicInfo(id, name)
      .setPriority(priority)
      .setScope("product")
      .setExclusive(false)
      .setBuyXGetY({
        buyQuantity: 2,
        getQuantity: 1,
        getProductIds: productIds
      })
      .addTags("买赠")

    if (productIds) {
      builder.matchProductIds(productIds)
    }

    return builder.build()
  }

  /**
   * 创建VIP专享折扣
   */
  static createVipDiscount(
    id: number,
    name: string,
    discountPercentage: number,
    minAmount: number,
    priority: number = 90
  ): PromotionRule {
    return new RuleBuilder()
      .setBasicInfo(id, name)
      .setPriority(priority)
      .setScope("global")
      .setExclusive(false)
      .setOrderConditions({ totalAmount: { min: minAmount } })
      .setPercentageDiscount(discountPercentage)
      .addTags("VIP", "专享")
      .setMetadata({ userLevel: "vip" })
      .build()
  }

  /**
   * 创建组合套装优惠
   */
  static createBundleDiscount(
    id: number,
    name: string,
    requiredProducts: Array<{ productId: number, quantity: number }>,
    discountAmount: number,
    priority: number = 110
  ): PromotionRule {
    return new RuleBuilder()
      .setBasicInfo(id, name)
      .setPriority(priority)
      .setScope("order")
      .setExclusive(false)
      .setBundleDiscount({
        requiredProducts: requiredProducts.map(p => ({
          productId: p.productId,
          quantity: p.quantity
        })),
        discountType: "fixed",
        discountValue: discountAmount
      })
      .addTags("套装", "组合")
      .build()
  }

  // ==================== JSON输出方法 ====================

  /**
   * 创建系列折扣规则并返回JSON
   */
  static createSeriesDiscountJSON(
    id: number,
    name: string,
    series: string[],
    discountPercentage: number,
    priority: number = 100,
    compact: boolean = false
  ): string {
    const rule = this.createSeriesDiscount(id, name, series, discountPercentage, priority)
    return compact ? JSON.stringify(rule) : JSON.stringify(rule, null, 2)
  }

  /**
   * 创建满减规则并返回JSON
   */
  static createFullReductionJSON(
    id: number,
    name: string,
    tiers: Array<{ threshold: number, discount: number }>,
    priority: number = 80,
    compact: boolean = false
  ): string {
    const rule = this.createFullReduction(id, name, tiers, priority)
    return compact ? JSON.stringify(rule) : JSON.stringify(rule, null, 2)
  }

  /**
   * 创建特价商品规则并返回JSON
   */
  static createSpecialPriceJSON(
    id: number,
    name: string,
    productIds: number[],
    specialPrice: number,
    priority: number = 200,
    compact: boolean = false
  ): string {
    const rule = this.createSpecialPrice(id, name, productIds, specialPrice, priority)
    return compact ? JSON.stringify(rule) : JSON.stringify(rule, null, 2)
  }

  /**
   * 创建新用户首单优惠并返回JSON
   */
  static createFirstOrderDiscountJSON(
    id: number,
    name: string,
    discountPercentage: number,
    maxDiscount: number,
    priority: number = 150,
    compact: boolean = false
  ): string {
    const rule = this.createFirstOrderDiscount(id, name, discountPercentage, maxDiscount, priority)
    return compact ? JSON.stringify(rule) : JSON.stringify(rule, null, 2)
  }

  /**
   * 创建限时抢购规则并返回JSON
   */
  static createFlashSaleJSON(
    id: number,
    name: string,
    productIds: number[],
    discountPercentage: number,
    startTime: string,
    endTime: string,
    priority: number = 300,
    compact: boolean = false
  ): string {
    const rule = this.createFlashSale(id, name, productIds, discountPercentage, startTime, endTime, priority)
    return compact ? JSON.stringify(rule) : JSON.stringify(rule, null, 2)
  }

  /**
   * 创建买二送一规则并返回JSON
   */
  static createBuy2Get1FreeJSON(
    id: number,
    name: string,
    productIds?: number[],
    priority: number = 120,
    compact: boolean = false
  ): string {
    const rule = this.createBuy2Get1Free(id, name, productIds, priority)
    return compact ? JSON.stringify(rule) : JSON.stringify(rule, null, 2)
  }

  /**
   * 创建VIP专享折扣并返回JSON
   */
  static createVipDiscountJSON(
    id: number,
    name: string,
    discountPercentage: number,
    minAmount: number,
    priority: number = 90,
    compact: boolean = false
  ): string {
    const rule = this.createVipDiscount(id, name, discountPercentage, minAmount, priority)
    return compact ? JSON.stringify(rule) : JSON.stringify(rule, null, 2)
  }

  /**
   * 创建组合套装优惠并返回JSON
   */
  static createBundleDiscountJSON(
    id: number,
    name: string,
    requiredProducts: Array<{ productId: number, quantity: number }>,
    discountAmount: number,
    priority: number = 110,
    compact: boolean = false
  ): string {
    const rule = this.createBundleDiscount(id, name, requiredProducts, discountAmount, priority)
    return compact ? JSON.stringify(rule) : JSON.stringify(rule, null, 2)
  }

  /**
   * 通用方法：将任何PromotionRule转换为JSON
   */
  static toJSON(rule: PromotionRule, compact: boolean = false): string {
    return compact ? JSON.stringify(rule) : JSON.stringify(rule, null, 2)
  }
}

// ==================== 规则验证器 ====================

/**
 * 规则验证器
 */
export class RuleValidator {
  /**
   * 验证规则
   */
  static validate(rule: PromotionRule): { valid: boolean, errors: string[], warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础验证
    if (!rule.id || rule.id <= 0) {
      errors.push("规则ID必须是正整数")
    }

    if (!rule.name || rule.name.trim() === "") {
      errors.push("规则名称不能为空")
    }

    if (rule.priority < 0) {
      errors.push("优先级不能为负数")
    }

    if (!["product", "order", "global"].includes(rule.scope)) {
      errors.push("作用域必须是 product、order 或 global")
    }

    // 时间验证
    if (rule.startTime && rule.endTime) {
      const start = new Date(rule.startTime)
      const end = new Date(rule.endTime)

      if (start >= end) {
        errors.push("开始时间必须早于结束时间")
      }

      if (end < new Date()) {
        warnings.push("规则已过期")
      }
    }

    // 折扣策略验证
    const strategyValidation = this.validateDiscountStrategy(rule.discountStrategy)
    errors.push(...strategyValidation.errors)
    warnings.push(...strategyValidation.warnings)

    // 条件验证
    const conditionValidation = this.validateConditions(rule)
    errors.push(...conditionValidation.errors)
    warnings.push(...conditionValidation.warnings)

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证折扣策略
   */
  private static validateDiscountStrategy(strategy: DiscountStrategy): { errors: string[], warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    if (!strategy) {
      errors.push("必须指定折扣策略")
      return { errors, warnings }
    }

    switch (strategy.type) {
      case "percentage":
        if (strategy.value < -100 || strategy.value > 100) {
          errors.push("百分比折扣值必须在-100-100之间")
        }
        if (strategy.value > 50) {
          warnings.push("折扣力度较大，请确认")
        }
        break

      case "fixed":
        if (strategy.value <= 0) {
          errors.push("固定折扣金额必须大于0")
        }
        break

      case "specialPrice":
        if (strategy.value <= 0) {
          errors.push("特价必须大于0")
        }
        break

      case "tieredReduction":
        if (!strategy.tieredConfig) {
          errors.push("阶梯满减必须配置阶梯信息")
        } else {
          const tiers = strategy.tieredConfig.tiers
          if (!tiers || tiers.length === 0) {
            errors.push("阶梯配置不能为空")
          } else {
            // 验证阶梯顺序
            for (let i = 1; i < tiers.length; i++) {
              if (tiers[i].threshold <= tiers[i - 1].threshold) {
                errors.push("阶梯门槛必须递增")
              }
            }
          }
        }
        break

      case "buyXGetY":
        if (!strategy.buyXGetYConfig) {
          errors.push("买X送Y必须配置相关信息")
        } else {
          const config = strategy.buyXGetYConfig
          if (config.buyQuantity <= 0) {
            errors.push("购买数量必须大于0")
          }
          if (config.getQuantity <= 0) {
            errors.push("赠送数量必须大于0")
          }
        }
        break

      case "bundle":
        if (!strategy.bundleConfig) {
          errors.push("套装优惠必须配置套装信息")
        }
        break

      default:
        errors.push(`不支持的折扣类型: ${strategy.type}`)
    }

    return { errors, warnings }
  }

  /**
   * 验证条件
   */
  private static validateConditions(rule: PromotionRule): { errors: string[], warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查商品条件
    if (rule.scope === "product" && Object.keys(rule.productConditions).length === 0) {
      warnings.push("商品级规则没有设置商品匹配条件，将匹配所有商品")
    }

    // 检查订单条件
    if (rule.scope === "order" && !rule.orderConditions) {
      warnings.push("订单级规则建议设置订单条件")
    }

    // 检查全局条件
    if (rule.scope === "global" && !rule.orderConditions) {
      warnings.push("全局规则建议设置订单条件")
    }

    return { errors, warnings }
  }
}

// ==================== 导出 ====================

export default {
  RuleBuilder,
  RuleTemplates,
  RuleValidator
}
