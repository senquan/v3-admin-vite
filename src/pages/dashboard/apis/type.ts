export interface DashboardListData {
  time: string
  category: string
  amount: number
  content: string
  account: string
  accountTo: string
  id?: string | number
}

export interface DashboardListResponseData {
  code: number
  message: string
  data: {
    records: DashboardListData[]
    total: number
    page: number
    pageSize: number
  }
}