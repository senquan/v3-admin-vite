import type {
  ApiResponse,
  LotteryConfig,
  LotteryHistoryQuery,
  LotteryHistoryResponse,
  LotterySpinRequest,
  LotterySpinResponse,
  PrizeRedeemRequest,
  PrizeRedeemResponse,
  UserLotteryStats
} from "./type"
import { request } from "@/http/axios"

// 获取抽奖配置
export function fetchLotteryConfig(): Promise<ApiResponse<LotteryConfig>> {
  return request({
    url: "/lottery/config",
    method: "GET"
  })
}

// 执行抽奖
export function spinLottery(data: LotterySpinRequest): Promise<ApiResponse<LotterySpinResponse>> {
  return request({
    url: "/lottery/spin",
    method: "POST",
    data
  })
}

// 获取用户抽奖统计
export function fetchUserLotteryStats(): Promise<ApiResponse<UserLotteryStats>> {
  return request({
    url: "/lottery/stats",
    method: "GET"
  })
}

// 获取用户抽奖历史
export function fetchLotteryHistory(params: LotteryHistoryQuery): Promise<ApiResponse<LotteryHistoryResponse>> {
  return request({
    url: "/lottery/history",
    method: "GET",
    params
  })
}

// 获取用户剩余抽奖次数
export function fetchRemainingChances(): Promise<ApiResponse<{ remainingChances: number }>> {
  return request({
    url: "/lottery/chances",
    method: "GET"
  })
}

// 兑换奖品
export function redeemPrize(data: PrizeRedeemRequest): Promise<ApiResponse<PrizeRedeemResponse>> {
  return request({
    url: "/lottery/redeem",
    method: "POST",
    data
  })
}

// 重置抽奖次数（管理员功能）
export function resetLotteryChances(userId?: number): Promise<ApiResponse<{ success: boolean }>> {
  return request({
    url: "/lottery/reset-chances",
    method: "POST",
    data: { userId }
  })
}

// 获取抽奖活动状态
export function fetchLotteryStatus(): Promise<ApiResponse<{ active: boolean, startTime: string, endTime: string }>> {
  return request({
    url: "/lottery/status",
    method: "GET"
  })
}

// 验证抽奖资格
export function validateLotteryEligibility(): Promise<ApiResponse<{ eligible: boolean, reason?: string }>> {
  return request({
    url: "/lottery/validate",
    method: "GET"
  })
}
