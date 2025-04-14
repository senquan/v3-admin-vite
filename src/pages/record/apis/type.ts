export interface RecordListData {
  id?: string | number
  time: string
  category: string
  amount: number
  content: string
  account: string
  accountTo: string
  remark: string
  type: number
}

export interface RecordDetailData {
  id?: string | number
  templateId: number
  title: string
  remark: string
  amount: number
  amountIn: number
  logTime: string
  categoryId: number
  accountFrom: number
  accountTo: number
  tags: number[]
  tagNames: string[]
  events: number[]
  options: string[]
}

export interface RecordListRequestParams {
  format?: string
  type?: number
  keyword?: string
  startDate?: string
  endDate?: string
  showTransfer?: boolean | false
  page?: number
  pageSize?: number
}

export interface RecordRecentTopRequestParams {
  format?: string
  limit?: number
}

export interface RecordListResponseData {
  code: number
  message: string
  data: {
    records: RecordListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface RecordDetailResponseData {
  code: number
  message: string
  data: RecordDetailData
}

export interface RecordCreateRequestBody {
  title?: string
  remark?: string
  amount: number
  amountIn?: number
  logTime: string
  categoryId?: number
  accountFrom: number
  accountTo?: number
  templateId: number,
  tags?: number[]
  events?: number[],
  options?: any
}

export interface RecordActionResponseData {
  code: number
  message: string
}
