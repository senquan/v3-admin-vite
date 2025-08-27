import type * as Record from "./type"
import { request } from "@/http/axios"

export function fetchListGroup(params: Record.RecordListRequestParams) {
  return request<Record.RecordListResponseData>({
    url: "record/group",
    method: "get",
    params
  })
}

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

export function fetchDetail(id: number) {
  return request<Record.RecordDetailResponseData>({
    url: `record/${id}`,
    method: "get"
  })
}

export function loadParticipants(id: number) {
  return request<Record.RecordParticipantListResponseData>({
    url: `record/${id}/participants`,
    method: "get"
  })
}

export function generateQRCode(id: number) {
  return request<Record.RecordQRCodeResponseData>({
    url: `record/${id}/qrcode`,
    method: "get"
  })
}
