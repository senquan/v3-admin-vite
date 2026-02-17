export interface FixedDepositsResponseData extends ApiResponseData<FixedDeposits> {}

export interface LoanDepositSummaryParams {
  companyCode: string
  startDate: string
  endDate: string
  page: number
  size: number
}

export interface FixedDepositsParams {
  keyword?: string
  startDate?: string
  endDate?: string
  status?: number
  page?: number
  size?: number
}

export interface CommonActionResult {
  code: number
  message: string
  data: any
}

export interface LoanDepositSummaryResult {
  id: number
  companyCode: string
  companyName: string
  depositDate: string
  depositAmount: number
  depositInterest: number
  totalAmount: number
}

export interface FixedDeposits {
  id: number
  companyName: string
  batchNo: string
  depositDate: string
  depositAmount: number
  depositInterest: number
  totalAmount: number
  status: number
}
