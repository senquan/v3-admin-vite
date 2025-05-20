import type * as Promotion from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Promotion.PromotionListRequestParams) {
  return request<Promotion.PromotionListResponseData>({
    url: "promotion/list",
    method: "get",
    params
  })
}

export function fetchPromotionRules(params: Promotion.PromotionRulesListRequestParams) {
  return request<Promotion.PromotionRulesListResponseData>({
    url: "promotion/list/price",
    method: "get",
    params
  })
}

export function fetchPromotion(id: number) {
  return request<Promotion.PromotionDetailResponseData>({
    url: `promotion/${id}`,
    method: "get"
  })
}

export function createPromotion(data: Promotion.PromotionCreateData) {
  return request<Promotion.PromotionActionResponseData>({
    url: "promotion/",
    method: "post",
    data
  })
}

export function updatePromotion(id: number, data: Promotion.PromotionCreateData) {
  return request<Promotion.PromotionActionResponseData>({
    url: `promotion/${id}`,
    method: "put",
    data
  })
}

export function deletePromotion(id: number) {
  return request<Promotion.PromotionActionResponseData>({
    url: `promotion/${id}`,
    method: "delete"
  })
}

export function fetchRule(id: number) {
  return request<Promotion.RuleDetailResponseData>({
    url: `promotion/rule/${id}`,
    method: "get"
  })
}

export function createRule(data: Promotion.RuleCreateData) {
  return request<Promotion.PromotionActionResponseData>({
    url: "promotion/rule/",
    method: "post",
    data
  })
}

export function updateRule(id: number, data: Promotion.RuleCreateData) {
  return request<Promotion.PromotionActionResponseData>({
    url: `promotion/rule/${id}`,
    method: "put",
    data
  })
}

export function deleteRule(id: number) {
  return request<Promotion.PromotionActionResponseData>({
    url: `promotion/rule/${id}`,
    method: "delete"
  })
}

export function convertRule(id: number, data: { formula: string }) {
  return request<Promotion.PromotionActionResponseData>({
    url: `promotion/${id}/rule/convert`,
    method: "post",
    data
  })
}
