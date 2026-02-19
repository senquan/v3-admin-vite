export interface FixedDepositsResponseData extends ApiResponseData<FixedDeposits> {}
export interface PaymentClearingResponseData extends ApiResponseData<PaymentClearing> {}
export interface FundTransferResponseData extends ApiResponseData<FundTransfer> {}
export interface AdvanceExpenseResponseData extends ApiResponseData<AdvanceExpense> {}
export interface ExpenseTypeResponseData extends ApiResponseData<ExpenseType> {}

export interface BaseQueryParams {
  keyword?: string
  page?: number
  size?: number
}

export interface LoanDepositSummaryParams extends BaseQueryParams {
  companyCode: string
  startDate: string
  endDate: string
}

export interface FixedDepositsParams extends BaseQueryParams {
  startDate?: string
  endDate?: string
  status?: number
}

export interface PaymentClearingParams extends BaseQueryParams {
  receiveType?: number
  status?: number
}

export interface FundTransferParams extends BaseQueryParams {
  type: number
  status?: number
  startDate?: string
  endDate?: string
}

export interface AdvanceExpenseParams extends BaseQueryParams {
  type: number
  status?: number
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

export interface PaymentClearing {
  [key: string]: any
}

export interface FundTransfer {
  [key: string]: any
}

export interface AdvanceExpense {
  [key: string]: any
}

export interface ExpenseType {
  id: number
  name: string
}
