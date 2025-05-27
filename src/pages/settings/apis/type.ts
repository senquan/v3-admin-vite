export interface DictListData {
  id: number
  name: string
  remark: string
  value: string
  group: number
  icon: string
  updatedAt: string
}

export interface SettingsListData {
  id: number
  name: string
  type: number
  key: string
  value: string
  group: number
  description: string
}

export interface SettingsListResponseData {
  code: number
  message: string
  data: {
    settings: SettingsListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface SettingsCreateData {
  id?: number
  key: string
  value: string
}

export interface DictCreateData {
  id?: number
  name: string
  remark: string
  value: string
  group: number
}

export interface DictListResponseData {
  code: number
  message: string
  data: {
    dicts: DictListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CommonListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface CommonActionResponseData {
  code: number
  message: string
}
