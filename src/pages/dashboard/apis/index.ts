import type * as Dashboard from "./type"
import { request } from "@/http/axios"

export function fetchIndex() {
  return request<Dashboard.DashboardListResponseData>({
    url: "dashboard/",
    method: "get"
  })
}
