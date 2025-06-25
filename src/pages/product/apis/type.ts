export interface Series {
  id: number
  name: string
}

export interface Color {
  id: number
  name: string
  value: string
}

export interface Models {
  id: number
  name: string
  serie: Series
}

export interface Tag {
  id: number
  name: string
  color: Color
}

export interface FilterOptionsData {
  name: string
  material: string
  barcode: string
  model: string
  status: number
}

export interface ProductListData {
  id: number
  sku: string
  materialId: string
  barCode: string
  modelTypeId: number
  modelType: Models
  serieId: number
  serie: Series
  color: Color
  name: string
  basePrice: number
  projectPrice: number
  factoryPrice: number
  status: number
  imageUrls: string
  remark: string
  updatedAt: string
  tags: Tag[]
}

export interface ProductCreateData {
  materialId: string
  barCode: string
  modelType: number | string
  colorId: number | string
  name: string
  basePrice: number
  projectPrice: number
  factoryPrice: number
  imageFiles: string[]
  remark: string
  tags: number[]
}

export interface ProductListRequestParams {
  mid?: string
  model?: string
  images?: string
  platform?: number
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface BatchUpdateRequestParams {
  ids: number[]
  scope: string
  adjustType: string
  values: number[]
  searchParams?: ProductListRequestParams
}

export interface BatchDeleteRequestParams {
  ids: number[]
}

export interface ProductListResponseData {
  code: number
  message: string
  data: {
    products: ProductListData[]
    colors: Color[]
    total: number
    page: number
    pageSize: number
  }
}

export interface ProductDetailResponseData {
  code: number
  message: string
  data: ProductListData
}

export interface SeriesListOptResponseData {
  code: number
  message: string
  data: Series[]
}

export interface ModelListRequestParams {
  keyword?: string
  type?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface ModelsListResponseData {
  code: number
  message: string
  data: {
    models: Models[]
    total: number
    page: number
    pageSize: number
  }
}

export interface ProductActionResponseData {
  code: number
  message: string
}

export interface ProductImportResponseData {
  code: number
  message: string
  data: {
    success: number
    ignored: number
    updated: number
    fail: number
    failList: any[]
    error: number
    errorMessages: string[]
  }
}

export interface ProductPriceHistoryResponseData {
  code: number
  message: string
  data: {
    basePrice: number
    priceHistory: {
      id: number
      price: number
      quantity: number
      updatedAt: string
    }[]
  }
}
