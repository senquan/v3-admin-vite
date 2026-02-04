import type * as Account from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Account.AccountListRequestParams) {
  return request<Account.AccountListResponseData>({
    url: "account/list",
    method: "get",
    params
  })
}

export function fetchListOpt() {
  return request<Account.AccountListOptResponseData>({
    url: "account/list",
    method: "get",
    params: {
      format: "opt"
    }
  })
}

export function createAccount(data: Account.AccountCreateData) {
  return request<Account.AccountActionResponseData>({
    url: "account/",
    method: "post",
    data
  })
}

export function updateAccount(id: number, data: Account.AccountCreateData) {
  return request<Account.AccountActionResponseData>({
    url: `account/${id}`,
    method: "put",
    data
  })
}

export function deleteAccount(id: number) {
  return request<Account.AccountActionResponseData>({
    url: `account/${id}`,
    method: "delete"
  })
}
