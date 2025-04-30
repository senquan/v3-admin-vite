export interface RoleListData {
  id: number
  name: string
  code: string
  description: string
  status: number
  updatedAt: string
}

export interface Tag {
  id: number
  name: string
}

export interface RoleCreateData {
  id?: number
  name: string
  code: string
  description: string
}

export interface RoleTagsData {
  id?: number
  tags: number[]
}

export interface RoleListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface RoleListResponseData {
  code: number
  message: string
  data: {
    roles: RoleListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface RoleTagsResponseData {
  code: number
  message: string
  data: {
    tags: Tag[]
    allTags: Tag[]
    total: number
    page: number
    pageSize: number
  }
}

export interface RoleDetailResponseData {
  code: number
  message: string
  data: RoleListData
}

export interface RoleActionResponseData {
  code: number
  message: string
}
