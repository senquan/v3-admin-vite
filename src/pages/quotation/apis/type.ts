import type { ProductListData } from "../../product/apis/type"

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
  platformId: number
  authCode: string
  customerId: number
  reviewerId: number | null
  userId: number
  quantity: number
  originPrice: string
  payPrice: string
  payStatus: number
  createdAt: string
  updatedAt: string
  payAt: string | null
  status: number
  remark: string | null
  items: OrderItemsData[]
}

export interface OrderItemsData {
  id: number
  orderId: number
  productId: number
  product: ProductListData
  quantity: number
  totalPrice: string
  unitPrice: string
}

export interface OrderCreateData {
  type: number
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

export interface OrderUpdateStatusData {
  status: number
  remark: string
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

export interface OrderSalesReportResponseData {
  code: number
  message: string
  data: {
    months: string[]
    platforms: string[]
    sales: number[][]
  }
}

export interface OrderCategoryReportResponseData {
  code: number
  message: string
  data: {
    series: string[]
    models: string[]
  }
}

export interface ReturnOrderStatusLogResponseData {
  orderType: number
  previousStatus: number
  currentStatus: number
  operatorName: string
  operation: string
  remark: string | null
  createdAt: number
}
