import type * as Report from "./type"
import { request } from "@/http/axios"

export function getClearingSummary(params: BaseQueryParams) {
  return request<Report.ClearingSummaryResponseData>({
    url: "/report/clearing-summary",
    method: "get",
    params
  })
}

export function getDepositLoanSummary(params: Report.DepositLoanQueryParams) {
  return request<Report.DepositLoanSummaryResponseData>({
    url: "/report/deposit-loan-summary",
    method: "get",
    params
  })
}
