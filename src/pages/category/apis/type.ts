export interface CategoryListData {
  id: number
  name: string
  parentId: number
  type: number
  userId: number
  icon: string
  remark: string
  sort: number
  isDeleted: number
  isHidden: number
  createdAt: string
  updatedAt: string
  deletedAt: string
}

export interface CategoryListRequestParams {
  keyword?: string
  startDate?: string
  endDate?: string
  showTransfer?: boolean | false
  page?: number
  pageSize?: number
}

export interface CategoryListResponseData {
  code: number
  message: string
  data: {
    categories: CategoryListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CategoryListOptResponseData {
  code: number
  message: string
  data: CategoryListData[]
}

export interface CategoryCreateRequestBody {
  keyword?: string
  startDate?: string
  endDate?: string
  showTransfer?: boolean | false
  page?: number
  pageSize?: number
}

export interface CategoryActionResponseData {
  code: number
  message: string
}
