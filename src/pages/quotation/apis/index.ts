import type * as Order from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Order.OrderListRequestParams) {
  return request<Order.OrderListResponseData>({
    url: "order/list",
    method: "get",
    params
  })
}

export function fetchSeriesOpt() {
  return request<Order.SeriesListOptResponseData>({
    url: `order/series/list`,
    method: "get",
    params: {
      format: "opt"
    }
  })
}

export function fetchOrder(id: number) {
  return request<Order.OrderDetailResponseData>({
    url: `order/${id}`,
    method: "get"
  })
}

export function fetchOrderReport() {
  return request<Order.OrderSalesReportResponseData>({
    url: `order/sales`,
    method: "get"
  })
}

export function fetchCategoryReport() {
  return request<Order.OrderCategoryReportResponseData>({
    url: `order/category`,
    method: "get"
  })
}

export function createOrder(data: Order.OrderCreateData) {
  return request<Order.OrderActionResponseData>({
    url: "order/",
    method: "post",
    data
  })
}

export function updateOrder(id: number, data: Order.OrderCreateData) {
  return request<Order.OrderActionResponseData>({
    url: `order/${id}`,
    method: "put",
    data
  })
}

export function updateOrderStatus(id: number, data: Order.OrderUpdateStatusData) {
  return request<Order.OrderActionResponseData>({
    url: `order/${id}/status`,
    method: "put",
    data
  })
}

export function deleteOrder(id: number) {
  return request<Order.OrderActionResponseData>({
    url: `order/${id}`,
    method: "delete"
  })
}

export function importOrders(orders: any[]) {
  return request<Order.OrderImportResponseData>({
    url: "order/import",
    method: "post",
    data: { orders }
  })
}

export function calculateOrderPrice(data: Order.OrderPriceRequestData) {
  return request<Order.OrderPriceResponseData>({
    url: "order/price",
    method: "post",
    data
  })
}

export function createReturnOrder(data: Order.ReturnOrderCreateData) {
  return request<Order.OrderActionResponseData>({
    url: `order/return`,
    method: "post",
    data
  })
}

export function fetchOrderStatusLog(id: number) {
  return request<Order.ReturnOrderStatusLogResponseData>({
    url: `order/${id}/log`,
    method: "get"
  })
}
