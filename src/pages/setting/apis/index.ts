import type * as Tags from "./type"
import { request } from "@/http/axios"

export function fetchCategoryList(params: Tags.CommonListRequestParams) {
  return request<Tags.CategoryListResponseData>({
    url: "category/list",
    method: "get",
    params
  })
}

export function fetchCategoryListOpt() {
  return request<Tags.CategoryListResponseData>({
    url: "category/list",
    method: "get",
    params: {
      format: "opt"
    }
  })
}

export function createCategory(data: Tags.CategoryCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: "category/",
    method: "post",
    data
  })
}

export function updateCategory(id: number, data: Tags.CategoryCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: `category/${id}`,
    method: "put",
    data
  })
}

export function deleteCategory(id: number) {
  return request<Tags.CommonActionResponseData>({
    url: `category/${id}`,
    method: "delete"
  })
}
