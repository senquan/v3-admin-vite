import type * as Finance from "./type"
import { request } from "@/http/axios"

export function getLoanDepositSummary(params: Finance.LoanDepositSummaryParams) {
  return request<Finance.LoanDepositSummaryResult>({
    url: "/finance/loan-deposit-summary",
    method: "get",
    params
  })
}

export function getFixedDeposits(params: Finance.FixedDepositsParams) {
  return request<Finance.FixedDepositsResponseData>({
    url: "/finance/fixed-deposits",
    method: "get",
    params
  })
}

export function importDeposit(data: any, batchNo: string) {
  return request<Finance.CommonActionResult>({
    url: "/finance/import-deposit",
    method: "post",
    data: {
      deposits: data,
      batchNo
    }
  })
}
