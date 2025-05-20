export interface Series {
  id: number
  name: string
}

export interface Color {
  id: number
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
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
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
    fail: number
    failList: any[]
    error: number
    errorMessages: string[]
  }
}
