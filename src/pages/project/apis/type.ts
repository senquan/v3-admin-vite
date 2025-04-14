export interface ProjectListData {
  id: number
  expense: string
  income: string
  net: string
  diff: string
  tagName: string
  logTime: string
  updateAt: string
}

export interface ProjectDetailListData {
  id: number
  amount: string
  title: string
  logTime: string
}

export interface ProjectListRequestParams {
  keyword?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export interface ProjectDetailRequestParams {
  id: number
  page?: number
  pageSize?: number
}

export interface ProjectDetailResponseData {
  code: number
  message: string
  data: {
    records: ProjectDetailListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface ProjectListResponseData {
  code: number
  message: string
  data: {
    projects: ProjectListData[]
    total: number
    page: number
    pageSize: number
  }
}