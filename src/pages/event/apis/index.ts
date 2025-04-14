import type * as Event from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Event.EventListRequestParams) {
  return request<Event.EventListResponseData>({
    url: "event/",
    method: "get",
    params
  })
}