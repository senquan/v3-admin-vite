import type * as Customer from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Customer.CustomerListRequestParams) {
  return request<Customer.CustomerListResponseData>({
    url: "customer/list",
    method: "get",
    params
  })
}

export function fetchCustomer(id: number) {
  return request<Customer.CustomerDetailResponseData>({
    url: `customer/${id}`,
    method: "get"
  })
}

export function createCustomer(data: Customer.CustomerCreateData) {
  return request<Customer.CustomerActionResponseData>({
    url: "customer/",
    method: "post",
    data
  })
}

export function updateCustomer(id: number, data: Customer.CustomerCreateData) {
  return request<Customer.CustomerActionResponseData>({
    url: `customer/${id}`,
    method: "put",
    data
  })
}

export function deleteCustomer(id: number) {
  return request<Customer.CustomerActionResponseData>({
    url: `customer/${id}`,
    method: "delete"
  })
}
