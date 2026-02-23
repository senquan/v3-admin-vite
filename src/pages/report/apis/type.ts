export interface ClearingSummaryResponseData extends ApiResponseData<ClearingSummary> {}
export interface DepositLoanSummaryResponseData extends ApiResponseData<DepositLoanSummary> {}

export interface DepositLoanQueryParams extends BaseQueryParams {
  companyId?: string
}

export interface ClearingSummary {
  [key: string]: any
}

export interface DepositLoanSummary {
  [key: string]: any
}
