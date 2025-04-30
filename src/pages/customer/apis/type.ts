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
  materialId: string
  barCode: string
  modelType: string
  seriesId: number
  colorId: number | string
  name: string
  basePrice: number
  projectPrice: number
  factoryPrice: number
  remark: string
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
