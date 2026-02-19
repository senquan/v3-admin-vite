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

export function getPaymentClearings(params: Finance.PaymentClearingParams) {
  return request<Finance.PaymentClearingResponseData>({
    url: "/finance/payment-receives",
    method: "get",
    params
  })
}

export function getFundTransfers(params: Finance.FundTransferParams) {
  return request<Finance.FundTransferResponseData>({
    url: "/finance/fund-transfers",
    method: "get",
    params
  })
}

export function receiveConfirm(data: any) {
  return request<Finance.CommonActionResult>({
    url: "/finance/receive/confirm",
    method: "post",
    data
  })
}

export function receiveDelete(id: number) {
  return request<Finance.CommonActionResult>({
    url: "/finance/receive",
    method: "delete",
    data: { id }
  })
}

export function updateReceive(data: any, id: number) {
  return request<Finance.CommonActionResult>({
    url: `/finance/receive/${id}`,
    method: "put",
    data
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

export function importReceive(data: any, batchNo: string, receiveType: number) {
  return request<Finance.CommonActionResult>({
    url: "/finance/import-receive",
    method: "post",
    data: {
      receives: data,
      batchNo,
      receiveType
    }
  })
}

export function importTransfer(data: any, batchNo: string, transferType: number) {
  return request<Finance.CommonActionResult>({
    url: "/finance/import-transfer",
    method: "post",
    data: {
      transfers: data,
      batchNo,
      transferType
    }
  })
}
