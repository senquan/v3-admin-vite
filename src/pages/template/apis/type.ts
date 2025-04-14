export interface TemplateListData {
  id: number
  name: string
  group: number
  remark: string
  defaultField: string
  oidx: number
  createTime: string
  isDeleted: number
}

export interface TemplateListRequestParams {
  type?: string
  page?: number
  pageSize?: number
}

export interface TemplateListResponseData {
  code: number
  message: string
  data: {
    Templates: TemplateListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface TemplateListOptResponseData {
  code: number
  message: string
  data: TemplateListData[]
}

export interface TemplateFieldsResponseData {
  code: number
  message: string
  data: TemplateListData
}

export interface TemplateActionResponseData {
  code: number
  message: string
}
