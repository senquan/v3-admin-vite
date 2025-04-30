export interface Order {
  id: number
  name: string
  platform: string
  authCode: string
  customer: string
  reviewer: string
  quantity: number
  originPrice: string
  payPrice: string
  payStatus: number
  createdAt: number
  updatedAt: number
  status: number
  remark: string
}

export interface ReturnOrderListData {
  id: number
  name: string
  order: Order
  platform: string
  customer: string
  reviewer: string
  quantity: number
  returnAmount: string
  status: number
  refundStatus: number
  reason: string
  remark: string
  createdAt: number
  updatedAt: number
}

export interface ReturnOrderCreateData {
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

export interface ReturnOrderListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface ReturnOrderListResponseData {
  code: number
  message: string
  data: {
    returnOrders: ReturnOrderListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface ReturnOrderDetailResponseData {
  code: number
  message: string
  data: ReturnOrderListData
}

export interface ReturnOrderActionResponseData {
  code: number
  message: string
}
