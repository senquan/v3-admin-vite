export interface CustomerListData {
  id: number
  name: string
  type: number
  phone: string
  city: string
  level: number
  orderCount: number
  totalSpent: number
  remark: number
  createAt: string
}

export interface CustomerCreateData {
  id?: number
  name: string
  type: number
  code: string
  phone: string
  email: string
  address: string
  cityId: number
  provinceId: number
  districtId: number
  postalCode: string
  country: string
  contactPerson: string
  contactPhone: string
  contactPosition: string
  level: number
  companyName: string
  taxNumber: string
  remark: string
  salesRepId: number | null
  isActive: number
}

export interface CustomerListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface CustomerListResponseData {
  code: number
  message: string
  data: {
    customers: CustomerListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CustomerDetailResponseData {
  code: number
  message: string
  data: CustomerListData
}

export interface CustomerActionResponseData {
  code: number
  message: string
}
