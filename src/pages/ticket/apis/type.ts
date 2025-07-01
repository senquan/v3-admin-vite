export interface Ticket {
  id: number
  name: string
  assigneeId?: number
  attachments?: TicketAttachment[]
}

export interface TicketAttachment {
  id: number
  filename: string
  size: number
  mimetype: string
  path: string
}

export interface Assignee {
  id: number
  name: string
  username?: string
}

export interface AssigneeListResponseData {
  code: number
  message: string
  data: {
    assignees: Assignee[]
    assigneesByRole?: Record<string, Assignee[]>
  }
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
