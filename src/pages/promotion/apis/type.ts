export interface DictOptionsData {
  name: string
  value: string
}

export interface PromotionListData {
  id: number
  platform: number
  name: string
  type: number
  startTime: string
  endTime: string
  status: number
  description: string
  discountRate: number
  limitQuantity: number
  updatedAt: number
}

export interface RuleListData {
  id: number
  name: string
  type: number
  promotionId: number
  condition: string
  discountValue: number
  updatedAt: number
}

export interface TypeListData {
  id: number
  name: string
  group: number
  value: string
  remark: string
  icon: string
  updatedAt: number
}

export interface PromotionCreateData {
  id?: number
  platformId: number
  name: string
  type: number
  startTime: string
  endTime: string
  status: number
  description: string
}

export interface RuleCreateData {
  id: number
  name: string
  type: number
  promotionId: number
  condition: string
  discountValue: number
}

export interface PromotionListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface PromotionListResponseData {
  code: number
  message: string
  data: {
    promotions: PromotionListData[]
    platforms: DictOptionsData[]
    types: DictOptionsData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface PromotionDetailResponseData {
  code: number
  message: string
  data: {
    promotion: PromotionListData
    types: TypeListData[]
  }
}

export interface RuleDetailResponseData {
  code: number
  message: string
  data: RuleListData
}

export interface PromotionActionResponseData {
  code: number
  message: string
}
