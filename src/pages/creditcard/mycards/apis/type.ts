export interface CardListData {
  id: string | number
  aid: string | number
  name: string
  tagcode: string
  grade: number
  organization: string
  secondOrg: number
  billingDate: string
  currentDueDate: string
  creditLimit: string
  bill: string
  isBill: number
  dueDate: string
  dueDateType: number
  isDischarged: number
  datediff: number
}

export interface BankListData {
  id?: string | number
  logo: string
  name: string
}

export interface CardListRequestParams {
  keyword?: string
  startDate?: string
  endDate?: string
  showTransfer?: boolean | false
  page?: number
  pageSize?: number
}

export interface CardListResponseData {
  code: number
  message: string
  data: {
    cards: CardListData[]
    banks: BankListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface UpdateCardBillRequestParams {
  id: number
  type: number
  billDate?: string
  billAmount?: string
  remark?: string,
  isDischarged?: number
}

export interface CardActionResponseData {
  code: number
  message: string
}