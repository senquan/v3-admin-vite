// 奖品类型定义
export interface Prize {
  id: number
  name: string
  type: 'points' | 'coupon' | 'gift' | 'retry' | 'empty'
  value: number
  color: string
  icon: string
  probability: number
  description: string
}

// 用户奖品记录
export interface UserPrize extends Prize {
  time: string
  userId?: number
  status?: 'pending' | 'claimed' | 'expired'
}

// 抽奖配置
export interface LotteryConfig {
  prizes: Prize[]
  settings: {
    dailyLimit: number
    wheelSpeed: number
    minSpins: number
    maxSpins: number
  }
}

// 抽奖请求参数
export interface LotterySpinRequest {
  userId?: number
  timestamp?: number
}

// 抽奖响应结果
export interface LotterySpinResponse {
  success: boolean
  prize: Prize | null
  message: string
  remainingChances: number
  userPrizes: UserPrize[]
}

// 用户抽奖统计
export interface UserLotteryStats {
  totalSpins: number
  totalPrizes: number
  totalPoints: number
  totalCoupons: number
  totalGifts: number
  remainingChances: number
  lastSpinTime: string
}

// API响应基础结构
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 抽奖历史查询参数
export interface LotteryHistoryQuery {
  userId?: number
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
  prizeType?: string
}

// 抽奖历史响应
export interface LotteryHistoryResponse {
  records: UserPrize[]
  total: number
  page: number
  pageSize: number
}

// 奖品兑换请求
export interface PrizeRedeemRequest {
  prizeId: number
  userId?: number
  redeemCode?: string
}

// 奖品兑换响应
export interface PrizeRedeemResponse {
  success: boolean
  message: string
  redeemCode?: string
  expiryDate?: string
}