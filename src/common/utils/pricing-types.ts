/**
 * 操作符条件
 */
export interface OperatorCondition<T> {
  equal?: T
  notEqual?: T
  in?: T extends any[] ? T : T[]
  notIn?: T extends any[] ? T : T[]
  contains?: string[]
  notContains?: string[]
  greaterThan?: number
  greaterThanOrEqual?: number
  lessThan?: number
  lessThanOrEqual?: number
  like?: string[]
  notLike?: string[]
}

/**
 * 阶梯满减配置
 */
export interface TieredReductionConfig {
  tiers: Array<{
    threshold: number // 满足金额
    discount: number // 减免金额
    every?: number // 每满多少减免一次
    subjectType?: "amount" | "quantity" // 减免对象，默认amount
    discountType?: "fixed" | "percentage" | "every" // 减免类型，默认fixed
  }>
  maxDiscount?: number // 最大折扣限制
}

/**
 * 折扣策略类型
 */
export type DiscountType =
  | "percentage" // 百分比折扣
  | "fixed" // 固定金额折扣
  | "specialPrice" // 特价
  | "tieredReduction" // 阶梯满减
  | "buyXGetY" // 买X送Y
  | "bundle" // 套装优惠

/**
 * 强壮的促销规则结构
 */
export interface PromotionRule {
  id: number
  promotionType?: number
  name: string
  description?: string

  // 规则基础信息
  priority: number // 优先级，数字越大优先级越高
  scope: "product" | "order" | "global" // 作用域
  exclusive: boolean // 是否排他（不能与其他规则叠加）

  // 时间条件
  startTime?: string
  endTime?: string

  // 商品匹配条件
  productConditions: ProductMatchCondition

  // 订单级别条件（用于全局规则）
  orderConditions?: {
    totalAmount?: OperatorCondition<number>
    totalQuantity?: OperatorCondition<number>
    productCount?: OperatorCondition<number>
  }

  // 折扣策略
  discountStrategy: DiscountStrategy

  // 元数据
  tags?: string[]
  metadata?: Record<string, any>
}

/**
 * 商品匹配条件
 */
export interface ProductMatchCondition {
  // 基础字段匹配
  id?: OperatorCondition<number[]>
  name?: OperatorCondition<string[]>
  series?: OperatorCondition<string[]>
  color?: OperatorCondition<string[]>
  modelType?: OperatorCondition<string[]>
  category?: OperatorCondition<string[]>

  // 价格条件
  basePrice?: OperatorCondition<number>
  projectPrice?: OperatorCondition<number>
  totalBasePrice?: OperatorCondition<number>
  totalProjectPrice?: OperatorCondition<number>

  // 数量条件
  quantity?: OperatorCondition<number>

  // 自定义属性
  [key: string]: any
}

/**
 * 折扣策略配置
 */
export interface DiscountStrategy {
  type: DiscountType
  value: number

  // 特殊配置
  tieredConfig?: TieredReductionConfig
  buyXGetYConfig?: BuyXGetYConfig
  bundleConfig?: BundleConfig

  // 限制条件
  maxDiscount?: number // 最大折扣金额
  maxApplications?: number // 最大应用次数
  applyToQuantity?: number // 应用到的数量限制
}

/**
 * 商品信息（带数量）
 */
export interface ProductWithQuantity {
  id: number
  name: string
  basePrice: number
  projectPrice?: number
  quantity: number

  // 商品属性
  serie?: { id: number, name: string }
  color?: { value: string, name: string }
  modelType?: { id: number, name: string }
  category?: { id: number, name: string }

  // 其他属性
  [key: string]: any
}

/**
 * 套装优惠配置
 */
export interface BundleConfig {
  requiredProducts: Array<{
    productId?: number
    productName?: string
    quantity: number
    conditions?: ProductMatchCondition
  }>
  discountType: "percentage" | "fixed"
  discountValue: number
}

/**
 * 买X送Y配置
 */
export interface BuyXGetYConfig {
  buyQuantity: number // 购买数量
  getQuantity: number // 赠送数量
  getProductIds?: number[] // 指定赠品ID，为空则赠送相同商品
  maxApplications?: number // 最大应用次数
}

/**
 * 计算结果
 */
export interface PricingResult {
  // 总价信息
  originalTotalPrice: number
  totalDiscountAmount: number
  finalTotalPrice: number

  // 商品详情
  products: Array<{
    id: number
    quantity: number
    originalUnitPrice: number
    finalUnitPrice: number
    totalDiscount: number
    appliedRules: number[]
  }>

  // 应用的折扣详情
  discountApplications: DiscountApplication[]

  // 规则匹配日志
  matchLogs: Array<{
    ruleId: number
    ruleName: string
    matched: boolean
    reason?: string
    appliedProducts: number[]
  }>

  // 赠品信息
  freeProducts?: Array<{
    productId: number
    quantity: number
    fromRuleId: number
  }>
}

/**
 * 折扣应用结果
 */
export interface DiscountApplication {
  ruleId: number
  ruleName: string
  productId: number
  originalPrice: number
  discountValue: number
  discountAmount: number
  finalPrice: number
  quantity: number
  discountType: DiscountType
  metadata?: Record<string, any>
}
