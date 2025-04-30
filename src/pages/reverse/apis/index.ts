import type * as ReturnOrder from "./type"
import { request } from "@/http/axios"

export function fetchList(params: ReturnOrder.ReturnOrderListRequestParams) {
  return request<ReturnOrder.ReturnOrderListResponseData>({
    url: "order/return/list",
    method: "get",
    params
  })
}

export function fetchReturnOrder(id: number) {
  return request<ReturnOrder.ReturnOrderDetailResponseData>({
    url: `order/${id}`,
    method: "get"
  })
}

export function createReturnOrder(data: ReturnOrder.ReturnOrderCreateData) {
  return request<ReturnOrder.ReturnOrderActionResponseData>({
    url: "order/",
    method: "post",
    data
  })
}

export function updateReturnOrder(id: number, data: ReturnOrder.ReturnOrderCreateData) {
  return request<ReturnOrder.ReturnOrderActionResponseData>({
    url: `order/${id}`,
    method: "put",
    data
  })
}

export function deleteReturnOrder(id: number) {
  return request<ReturnOrder.ReturnOrderActionResponseData>({
    url: `order/${id}`,
    method: "delete"
  })
}
