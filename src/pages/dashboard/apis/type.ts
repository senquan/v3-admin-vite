export interface TicketListData {
  id: number
  title: string
  content: string
  ticketType: number
  priority: number
  status: number
  creator: {
    id: number
    username: string
  }
  assignee: {
    id: number
    username: string
  }
  remarks: string
  createdAt: string
  updatedAt: string
}

export interface TicketListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface TicketListResponseData {
  code: number
  message: string
  data: {
    tickets: TicketListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface TicketDetailResponseData {
  code: number
  message: string
  data: TicketListData
}

export interface TicketActionResponseData {
  code: number
  message: string
}

export interface StatsResponseData {
  code: number
  message: string
  data: {
    monthBackCount: string
    monthCs: string
    monthCsCount: number
    monthCustomerCount: number
    monthFinished: string
    monthFinishedCount: number
    monthOrderAmount: string
    monthOrderCount: number
    monthTicketAmount: number
    monthTicketRate: number
    monthTotalTickets: number
    totalCustomerCount: number
  }
}
