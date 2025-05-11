import type * as Dict from "./type"
import { request } from "@/http/axios"

export function fetchDictList(params: Dict.CommonListRequestParams) {
  return request<Dict.DictListResponseData>({
    url: "dict/list",
    method: "get",
    params
  })
}

export function createDict(data: Dict.DictCreateData) {
  return request<Dict.CommonActionResponseData>({
    url: "dict/",
    method: "post",
    data
  })
}

export function updateDict(id: number, data: Dict.DictCreateData) {
  return request<Dict.CommonActionResponseData>({
    url: `dict/${id}`,
    method: "put",
    data
  })
}

export function deleteDict(id: number) {
  return request<Dict.CommonActionResponseData>({
    url: `dict/${id}`,
    method: "delete"
  })
}
