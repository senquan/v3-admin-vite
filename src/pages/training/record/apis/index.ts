import type * as Record from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Record.RecordListRequestParams) {
  return request<Record.RecordListResponseData>({
    url: "record/list",
    method: "get",
    params
  })
}

export function fetchStaff(params: Record.RecordStaffListRequestParams) {
  return request<Record.RecordStaffListResponseData>({
    url: `user/list`,
    method: "get",
    params
  })
}

export function createRecord(data: Record.RecordCreateData) {
  return request<Record.RecordActionResponseData>({
    url: "record/",
    method: "post",
    data
  })
}
