export interface CategoryListData {
  id: number
  parentId: number
  name: string
  parent: string
  remark: string
  icon: string
}

export interface CategoryCreateData {
  id?: number
  ref?: string
  parentId?: number
  name: string
  description: string
  sort: number
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

export interface TagListData {
  id: number
  parentId: number
  name: string
  parent: string
  remark: string
  icon: string
  children?: TagListData[]
}

export interface TagCreateData {
  id?: number
  ref?: string
  parentId?: number
  name: string
  color: string
  description: string
  sort: number
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

export interface CommonListRequestParams {
  ids?: string
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface CommonActionResponseData {
  code: number
  message: string
}
