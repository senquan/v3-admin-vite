import type * as Dashboard from "./type"
import { request } from "@/http/axios"

export function fetchTicketList(params: Dashboard.TicketListRequestParams) {
  return request<Dashboard.TicketListResponseData>({
    url: "ticket/",
    method: "get",
    params
  })
}

export function fetchStats() {
  return request<Dashboard.StatsResponseData>({
    url: `dashboard/stats`,
    method: "get"
  })
}
