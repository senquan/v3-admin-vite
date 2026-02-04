import type * as Notify from "./type"
import { request } from "@/http/axios"

/** 列 */
export function fetchList(params: Notify.NotifyListRequestParams) {
  return request<Notify.NotifyListResponseData>({
    url: "/notifications",
    method: "get",
    params
  })
}

export function createNotify(data: any) {
  return request({
    url: "/notifications",
    method: "post",
    data
  })
}

/** 删 */
export function deleteNotify(id: number) {
  return request({
    url: `/notifications/${id}`,
    method: "delete"
  })
}

/** 改 */
export function updateNotify(id: number, data: any) {
  return request({
    url: `/notifications/${id}`,
    method: "put",
    data
  })
}

/** 查 */
export function fetchDetail(id: number) {
  return request<Notify.NotifyDetailResponseData>({
    url: `/notifications/${id}`,
    method: "get"
  })
}

/** 未读数量 */
export function fetchUnreadCounts(params: { type?: Notify.NotifyType }) {
  return request<Notify.NotifyUnreadCountResponseData>({
    url: "/notifications/unread/count",
    method: "get",
    params
  })
}

/** 已读 */
export function updateReadStatusBatch(params: { ids?: number[], type?: Notify.NotifyType }) {
  if (params.ids && params.ids.length > 0) {
    params.ids = params.ids.filter(id => id > 0)
    return request<Notify.NotifyActionResponseData>({
      url: "/notifications/batch/read",
      method: "patch",
      data: { ids: params.ids }
    })
  } else {
    return request<Notify.NotifyActionResponseData>({
      url: "/notifications/all/read",
      method: "patch",
      params: {
        type: params.type
      }
    })
  }
}
