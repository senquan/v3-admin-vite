export interface MatrixListData {
  _id: number
  category_id: number
  ref: string
  standard: string
  assessment_method: string
  creator: number
  updater: number
  created_time: string
  updated_time: string
  category?: {
    id: number
    name: string
  }
  creator_info?: {
    id: number
    name: string
  }
  updater_info?: {
    id: number
    name: string
  }
}

export interface MatrixCreateData {
  id?: number
  category_id: number
  ref: string
  standard: string
  assessment_method: number[]
}

export interface MatrixListRequestParams {
  keyword?: string
  format?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface MatrixStaffListRequestParams {
  keyword?: string
  type?: string
  id: string
}

export interface BatchDeleteRequestParams {
  ids: number[]
}

export interface MatrixListResponseData {
  code: number
  message: string
  data: {
    matrices: MatrixListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface MatrixDetailResponseData {
  code: number
  message: string
  data: MatrixListData
}

export interface MatrixActionResponseData {
  code: number
  message: string
}
