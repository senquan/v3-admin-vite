export interface Currency {
  id: number
  name: string
  symbol: string
  code: string
  exchangeRate: string
  updatedAt: string
}

export interface FilterOptionsData {
  group: number
  name: string
  remark: string | null
  tag: string
  value: string
}

export interface AccountListData {
  id: number
  userId: number
  aatype: number
  balance: number
  currency: Currency
  currencyId: number
  isDebt: number
  isDeleted: number
  isDefault: number
  isLedger: number
  isHidden: number
  is_notified: number
  liquidity: number
  liquidityName: string
  name: string
  remark: string
  subtype: number
  tagcode: number
  type: number
  typeName: string
  lastCheckAt: string | null
  updatedAt: string
  createdAt: string
  deletedAt: string | null
}

export interface AccountCreateData {
  id: number
  type: number
  subtype: number
  name: string
  liquidity: number
  tagcode: string
  remark: string
  isDefault: boolean
}

export interface AccountListOptData {
  id: number
  type: number
  name: string
  isLedger: number
  currency: number
}

export interface AccountListRequestParams {
  type?: number | string
  keyword?: string
  liquidity?: number | string
  hideEmpty?: boolean
  isLedger?: boolean
  sort?: string
  page?: number
  pageSize?: number
}

export interface AccountListResponseData {
  code: number
  message: string
  data: {
    accounts: AccountListData[]
    types: FilterOptionsData[]
    liquidities: FilterOptionsData[]
    currencies: Currency[]
    total: number
    page: number
    pageSize: number
  }
}

export interface AccountListOptResponseData {
  code: number
  message: string
  data: AccountListOptData[]
}

export interface AccountActionResponseData {
  code: number
  message: string
}
