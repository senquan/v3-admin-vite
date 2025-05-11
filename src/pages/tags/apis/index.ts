import type * as Tags from "./type"
import { request } from "@/http/axios"

export function fetchTagsList(params: Tags.CommonListRequestParams) {
  return request<Tags.TagsListResponseData>({
    url: "tags/list",
    method: "get",
    params
  })
}

export function createTags(data: Tags.TagsCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: "tags/",
    method: "post",
    data
  })
}
export function updateTags(id: number, data: Tags.TagsCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: `tags/${id}`,
    method: "put",
    data
  })
}

export function deleteTag(id: number) {
  return request<Tags.CommonActionResponseData>({
    url: `tags/${id}`,
    method: "delete"
  })
}

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

export function fetchSpecGroupList(params: Tags.CommonListRequestParams) {
  return request<Tags.SpecGroupListResponseData>({
    url: "spec/list",
    method: "get",
    params
  })
}

export function fetchSpecDetail(id: number) {
  return request<Tags.SpecGroupListResponseData>({
    url: `spec/${id}`,
    method: "get"
  })
}

export function createSpec(data: Tags.SpecCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: "spec/",
    method: "post",
    data
  })
}
export function updateSpec(id: number, data: Tags.SpecCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: `spec/${id}`,
    method: "put",
    data
  })
}

export function deleteSpec(id: number) {
  return request<Tags.CommonActionResponseData>({
    url: `spec/${id}`,
    method: "delete"
  })
}

export function createSpecItem(data: Tags.SpecItemCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: "spec/item/",
    method: "post",
    data
  })
}
export function updateSpecItem(id: number, data: Tags.SpecItemCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: `spec/item/${id}`,
    method: "put",
    data
  })
}

export function deleteSpecItem(id: number) {
  return request<Tags.CommonActionResponseData>({
    url: `spec/item/${id}`,
    method: "delete"
  })
}

export function fetchSerieList(params: Tags.CommonListRequestParams) {
  return request<Tags.SerieListResponseData>({
    url: "product/series/list",
    method: "get",
    params
  })
}

export function createSerie(data: Tags.SerieCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: "product/series/",
    method: "post",
    data
  })
}

export function updateSerie(id: number, data: Tags.SerieCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: `product/series/${id}`,
    method: "put",
    data
  })
}

export function deleteSerie(id: number) {
  return request<Tags.CommonActionResponseData>({
    url: `product/series/${id}`,
    method: "delete"
  })
}

export function fetchModelList(params: Tags.CommonListRequestParams) {
  return request<Tags.ModelListResponseData>({
    url: "product/models/list",
    method: "get",
    params
  })
}

export function createModel(data: Tags.ModelCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: "product/model/",
    method: "post",
    data
  })
}

export function updateModel(id: number, data: Tags.ModelCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: `product/model/${id}`,
    method: "put",
    data
  })
}

export function deleteModel(id: number) {
  return request<Tags.CommonActionResponseData>({
    url: `product/model/${id}`,
    method: "delete"
  })
}
