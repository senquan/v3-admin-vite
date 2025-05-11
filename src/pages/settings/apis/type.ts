export interface DictListData {
  id: number
  name: string
  remark: string
  value: string
  group: number
  icon: string
  updatedAt: string
}

export interface DictCreateData {
  id?: number
  name: string
  remark: string
  value: string
  group: number
}

export interface DictListResponseData {
  code: number
  message: string
  data: {
    dicts: DictListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CommonListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface CommonActionResponseData {
  code: number
  message: string
}
