export interface CompanyListResponseData extends ApiResponseData<Company> {}
export interface CompanyTreeResponseData extends ApiResponseData<CompanyTree> {}

export interface BaseQueryParams {
  keyword?: string
  page?: number
  size?: number
}

export interface CommonActionResult {
  code: number
  message: string
  data: any
}

export interface CompanyListRequestParams extends BaseQueryParams {
  status?: number
}

export interface Company {
  id: number
  companyCode: string
  companyName: string
  accountCode: string
  accountName: string
  parentCompanyId: number | null
  parentCompanyName?: string
  companyLevel: number
  status: number
  createdBy: any | null
  createdAt: string
  updatedBy: any | null
  updatedAt: string
}

export interface CompanyForm {
  [key: string]: any
}

export interface CompanyTree {
  value: string
  label: string
  children?: CompanyTree[]
}

export interface InterestRate {
  id: number
  rateType: number // 利率类型 由系统字典 group = 3 定义
  rateCode: string // 利率编号
  rateValue: number // 利率值(%)
  effectiveDate: string // 生效日期
  expiryDate: string // 失效日期
  status: number // 状态：1-生效，2-失效
  currency: string // 币种
  term: number // 期限(月)
  remark: string
  creator: any
  createdAt: string
  updater: any
  updatedAt: string
}

export interface InterestRateQueryParams extends BaseQueryParams {
  rateType?: number
  rateCode?: string
  status?: number
  currency?: string
  term?: number
}

export interface InterestRateForm {
  id?: number
  rateType: number
  rateCode?: string
  rateValue: number
  effectiveDate?: string
  expiryDate?: string | null
  status?: number
  currency?: string
  term?: number | null
  remark?: string | null
}
