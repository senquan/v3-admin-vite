import type * as Report from "./type"
import { request } from "@/http/axios"

export function getClearingSummary(params: BaseQueryParams) {
  return request<Report.ClearingSummaryResponseData>({
    url: "/report/clearing-summary",
    method: "get",
    params
  })
}

export function updateClearingSummary(data: Report.UpdateClearingSummaryRequestData, id: number) {
  return request<Report.BaseActionData>({
    url: `/report/clearing-summary/${id}`,
    method: "put",
    data
  })
}

export function getDepositLoanSummary(params: Report.DepositLoanQueryParams) {
  return request<Report.DepositLoanSummaryResponseData>({
    url: "/report/deposit-loan-summary",
    method: "get",
    params
  })
}

export function getInterestDetail(params: Report.InterestDetailQueryParams) {
  let url
  if (params.type === 2) {
    url = "/report/fixed-to-current-interest"
  } else if (params.type === 3) {
    url = "/report/daily-fixed-interest"
  } else {
    url = "/report/daily-interest"
  }
  return request<Report.InterestDetailResponseData>({
    url,
    method: "get",
    params
  })
}
