export interface TagListData {
  id: number
  name: string
  color: string
}

export interface TagListRequestParams {
  keyword?: string
  page?: number
  pageSize?: number
}

export interface TagListResponseData {
  code: number
  message: string
  data: {
    tags: TagListData[]
    total: number
    page: number
    pageSize: number
  }
}