import type { LedgerAccountData } from "../../project/apis/type"

export interface TagListData {
  id: number
  name: string
  color: string
  userId: number
  accountId: number
  isDeleted: number
  createdAt: string
  updatedAt: string
}

export interface TagListRequestParams {
  keyword?: string
  page?: number
  pageSize?: number
}

export interface TagListResponseData {
  code: number
  message: string
  data: {
    tags: TagListData[]
    accounts: LedgerAccountData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CreateTagRequestData {
  name: string
  color?: string
  accountId?: number | string
}

export interface UpdateTagRequestData {
  name?: string
  color?: string
  accountId?: number | string
}

export interface TagOperationResponseData {
  code: number
  message: string
  data: TagListData | null
}
