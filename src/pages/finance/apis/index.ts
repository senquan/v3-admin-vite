import type * as Finance from "./type"
import { request } from "@/http/axios"

export function getLoanDepositSummary(params: Finance.LoanDepositSummaryParams) {
  return request<Finance.LoanDepositSummaryResult>({
    url: "/finance/loan-deposit-summary",
    method: "get",
    params
  })
}

export function getCompanies() {
  return request<Finance.CompaniesResponseData>({
    url: "/company/companies",
    method: "get"
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

export function getAdvanceExpenses(params: Finance.AdvanceExpenseParams) {
  return request<Finance.AdvanceExpenseResponseData>({
    url: "/finance/advance-expenses",
    method: "get",
    params
  })
}

export function getExpenseTypes() {
  return request<Finance.ExpenseTypeResponseData>({
    url: "/finance/expense-types",
    method: "get"
  })
}

export function getProfitPayments(params: Finance.ProfitPaymentParams) {
  return request<Finance.ProfitPaymentResponseData>({
    url: "/finance/profit-payments",
    method: "get",
    params
  })
}

export function transferConfirm(data: any) {
  return request<Finance.CommonActionResult>({
    url: `/finance/transfer/confirm`,
    method: "post",
    data
  })
}

export function transferDelete(id: number) {
  return request<Finance.CommonActionResult>({
    url: `/finance/fund-transfer`,
    method: "delete",
    data: { id }
  })
}

export function receiveConfirm(data: any) {
  return request<Finance.CommonActionResult>({
    url: "/finance/receive/confirm",
    method: "post",
    data
  })
}

export function profitConfirm(data: any) {
  return request<Finance.CommonActionResult>({
    url: "/finance/profit-payments/confirm",
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

export function importAdvance(data: any, batchNo: string) {
  return request<Finance.CommonActionResult>({
    url: "/finance/import-advance-expense",
    method: "post",
    data: {
      expenses: data,
      batchNo
    }
  })
}

export function importProfit(data: any, batchNo: string) {
  return request<Finance.CommonActionResult>({
    url: "/finance/import-profit",
    method: "post",
    data: {
      profits: data,
      batchNo
    }
  })
}
