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
    url: `order/return/${id}`,
    method: "get"
  })
}

export function createReturnOrder(data: ReturnOrder.ReturnOrderCreateData) {
  return request<ReturnOrder.ReturnOrderActionResponseData>({
    url: "order/return/",
    method: "post",
    data
  })
}

export function updateReturnOrder(id: number, data: ReturnOrder.ReturnOrderCreateData) {
  return request<ReturnOrder.ReturnOrderActionResponseData>({
    url: `order/return/${id}`,
    method: "put",
    data
  })
}

export function deleteReturnOrder(id: number) {
  return request<ReturnOrder.ReturnOrderActionResponseData>({
    url: `order/return/${id}`,
    method: "delete"
  })
}

export function fetchReturnOrderStatusLog(id: number) {
  return request<ReturnOrder.ReturnOrderStatusLogResponseData>({
    url: `order/return/log/${id}`,
    method: "get"
  })
}
