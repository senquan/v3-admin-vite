import type * as Promotion from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Promotion.PromotionListRequestParams) {
  return request<Promotion.PromotionListResponseData>({
    url: "promotionv3/list",
    method: "get",
    params
  })
}

export function fetchPromotionRules(params: Promotion.PromotionRulesListRequestParams) {
  return request<Promotion.PromotionRulesListResponseData>({
    url: "promotionv3/list/price",
    method: "get",
    params
  })
}

export function fetchPromotion(id: number) {
  return request<Promotion.PromotionDetailResponseData>({
    url: `promotionv3/${id}`,
    method: "get"
  })
}

export function createPromotion(data: Promotion.PromotionCreateData) {
  return request<Promotion.PromotionActionResponseData>({
    url: "promotionv3/",
    method: "post",
    data
  })
}

export function updatePromotion(id: number, data: Promotion.PromotionCreateData) {
  return request<Promotion.PromotionActionResponseData>({
    url: `promotionv3/${id}`,
    method: "put",
    data
  })
}

export function deletePromotion(id: number) {
  return request<Promotion.PromotionActionResponseData>({
    url: `promotionv3/${id}`,
    method: "delete"
  })
}

export function fetchRule(id: number) {
  return request<Promotion.RuleDetailResponseData>({
    url: `promotionv3/rule/${id}`,
    method: "get"
  })
}

export function createRule(data: Promotion.RuleCreateData) {
  return request<Promotion.PromotionActionResponseData>({
    url: "promotionv3/rule/",
    method: "post",
    data
  })
}

export function updateRule(id: number, data: Promotion.RuleCreateData) {
  return request<Promotion.PromotionActionResponseData>({
    url: `promotionv3/rule/${id}`,
    method: "put",
    data
  })
}

export function deleteRule(id: number) {
  return request<Promotion.PromotionActionResponseData>({
    url: `promotionv3/rule/${id}`,
    method: "delete"
  })
}

export function convertRule(id: number, data: { formula: string }) {
  return request<Promotion.PromotionActionResponseData>({
    url: `promotionv3/${id}/rule/convert`,
    method: "post",
    data
  })
}
