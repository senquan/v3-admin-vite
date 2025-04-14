export interface EventListData {
  id?: string | number
  name: number
}

export interface EventListRequestParams {
  aid?: string | number
  page?: number
  pageSize?: number
}

export interface EventListResponseData {
  code: number
  message: string
  data: {
    events: EventListData[]
    total: number
    page: number
    pageSize: number
  }
}