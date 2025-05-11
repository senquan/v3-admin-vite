export interface TagsListData {
  id: number
}

export interface TagsCreateData {
  id?: number
  name: string
  color: string
}

export interface SpecGroupListData {
  id: number
  name: string
  isRequired: boolean
}

export interface SpecCreateData {
  id?: number
  name: string
}

export interface SpecItemCreateData {
  id?: number
  name?: string
  value: string
  groupId: number
  sort: number
}

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
  parentId?: number
  name: string
  remark: string
  icon: string
  sort: number
}

export interface SerieListData {
  id: number
  name: string
  image: string
  year: string
  category: string
}

export interface SerieCreateData {
  id?: number
  categoryId: number
  name: string
  image: string
  year: string
}

export interface ModelListData {
  id: number
  name: string
  image: string
  value: number
  sort: number
  serie: string
}

export interface ModelCreateData {
  id?: number
  serieId: number
  name: string
  image: string
  sort: number
}

export interface ModelListResponseData {
  code: number
  message: string
  data: {
    models: ModelListData[]
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

export interface TagsListResponseData {
  code: number
  message: string
  data: {
    tags: TagsListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface SpecGroupListResponseData {
  code: number
  message: string
  data: {
    groups: SpecGroupListData[]
    total: number
    page: number
    pageSize: number
  }
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

export interface SerieListResponseData {
  code: number
  message: string
  data: {
    series: SerieListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CommonActionResponseData {
  code: number
  message: string
}
