export interface Ticket {
  id: number
  name: string
  assigneeId?: number
}

export interface TicketDetailResponseData {
  code: number
  message: string
  data: Ticket
}

export interface CommonListRequestParams {
  ids?: string
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface TicketListResponseData {
  code: number
  message: string
  data: {
    tickets: Ticket[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CommonActionResponseData {
  code: number
  message: string
}
