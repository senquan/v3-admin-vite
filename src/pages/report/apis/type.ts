export interface ClearingSummaryResponseData extends ApiResponseData<ClearingSummary> {}
export interface DepositLoanSummaryResponseData extends ApiResponseData<DepositLoanSummary> {}
export interface InterestDetailResponseData extends ApiResponseData<InterestDetail> {}

export interface DepositLoanQueryParams extends BaseQueryParams {
  companyId?: string
}

export interface BaseActionData {
  code: number
  message: string
  data?: any
}

export interface InterestDetailQueryParams extends BaseQueryParams {
  type: number
  keyword?: string
  companyId?: string
}

export interface UpdateClearingSummaryRequestData {
  id?: number
  billAmount: number
  other: number
}

export interface ClearingSummary {
  [key: string]: any
}

export interface DepositLoanSummary {
  [key: string]: any
}

export interface InterestDetail {
  [key: string]: any
}
