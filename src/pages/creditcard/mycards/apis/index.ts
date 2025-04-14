import type * as Cards from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Cards.CardListRequestParams) {
  return request<Cards.CardListResponseData>({
    url: "cards/my",
    method: "get",
    params
  })
}

export function updateCardBill(id: number, data: Cards.UpdateCardBillRequestParams) {
  return request<Cards.CardActionResponseData>({
    url: `cards/${id}/bill`,
    method: "put",
    data
  })
}

export function deleteCard(id: number) {
  return request({
    url: `cards/${id}`,
    method: "delete"
  })
}
