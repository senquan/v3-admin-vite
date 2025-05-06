export interface FilterOptionsData {
  name: string
  material: string
  barcode: string
  model: string
  status: number
}

export interface OrderListData {
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
  orderItems: {
    id: number
    name: string
    material: string
    quantity: number
  }
}

export interface OrderCreateData {
  platformId: number
  name: string
  originPrice: number
  flashPrice: number
  dailyPrice: number
  promotionPrice: number
  products: {
    id: number
    unitPrice: number
    quantity: number
  }[]
}

export interface ReturnOrderCreateData {
  orderId: number
  returns: {
    productId: number
    quantity: number
  }[]
  remark: string
}

export interface SeriesListOptResponseData {
  code: number
  message: string
  data: {
    id: number
    name: string
  }[]
}

export interface OrderListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface OrderListResponseData {
  code: number
  message: string
  data: {
    orders: OrderListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface OrderPriceRequestData {
  platformId: number
  products: {
    id: number
    quantity: number
  }[]
}

export interface OrderPriceResponseData {
  code: number
  message: string
  data: {
    totalBasePrice: number
    dailyDiscount: number
    dailyPrice: number
    promotionDiscount: number
    promotionPrice: number
    flashDiscount: number
    flashPrice: number
    products: any[]
  }
}

export interface OrderDetailResponseData {
  code: number
  message: string
  data: OrderListData
}

export interface OrderActionResponseData {
  code: number
  message: string
}

export interface OrderImportResponseData {
  code: number
  message: string
  data: {
    success: number
    fail: number
    failList: any[]
    error: number
    errorMessages: string[]
  }
}
