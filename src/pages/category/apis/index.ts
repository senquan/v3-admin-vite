import type * as Category from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Category.CategoryListRequestParams) {
  return request<Category.CategoryListResponseData>({
    url: "category/list",
    method: "get",
    params
  })
}

export function fetchListOpt() {
  return request<Category.CategoryListOptResponseData>({
    url: "category/list",
    method: "get",
    params: {
      format: 'opt'
    }
  })
}

