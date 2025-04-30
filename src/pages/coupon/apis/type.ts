export interface CouponListData {
  id: number
  platform: string
  name: string
  type: number
  amount: number
  discount: number
  minAmount: number
  startTime: string
  endTime: string
  totalCount: number
  receivedCount: number
  usedCount: number
  perLimit: number
  description: number
  creator: string
  createdAt: string
  status: number
}

export interface CouponCreateData {
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

export interface CouponListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface CouponListResponseData {
  code: number
  message: string
  data: {
    coupons: CouponListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CouponDetailResponseData {
  code: number
  message: string
  data: CouponListData
}

export interface CouponActionResponseData {
  code: number
  message: string
}
