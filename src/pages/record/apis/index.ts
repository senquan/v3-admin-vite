import type * as Records from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Records.RecordListRequestParams) {
  return request<Records.RecordListResponseData>({
    url: "record/list",
    method: "get",
    params
  })
}

export function fetchDetail(id: number) {
  return request<Records.RecordDetailResponseData>({
    url: `record/${id}`,
    method: "get"
  })
}

export function fetchRecentTop(params: Records.RecordRecentTopRequestParams) {
  return fetchList({format: params?.format || 'recent-top-expense', page: 1, pageSize: params?.limit || 8 })
}

export function createRecord(data: Records.RecordCreateRequestBody) {
  return request<Records.RecordActionResponseData>({
    url: "record/",
    method: "post",
    data
  })
}

export function updateRecord(id: number, data: Records.RecordCreateRequestBody) {
  return request<Records.RecordActionResponseData>({
    url: `record/${id}`,
    method: "put",
    data
  })
}

export function deleteRecord(id: number) {
  return request<Records.RecordActionResponseData>({
    url: `record/${id}`,
    method: "delete"
  })
}
