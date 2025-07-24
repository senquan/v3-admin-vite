export interface SurveyQuestionOption {
  id?: number
  option_text: string
  option_value: string
}

export interface SurveyQuestion {
  id?: number
  question_text: string
  question_type: number // 1: 单选, 2: 多选, 3: 填空, 4: 简答
  is_required: number // 0: 非必填, 1: 必填
  sort_order: number
  options?: SurveyQuestionOption[]
}

export interface SurveyListData {
  id: number
  title: string
  description: string | null
  category: number
  status: number // 0: 草稿, 1: 发布, 2: 已结束
  start_time: string | null
  end_time: string | null
  is_anonymous: number // 0: 实名, 1: 匿名
  max_submissions: number | null
  submission_count: number
  view_count: number
  is_deleted: number
  creator: number | null
  updater: number | null
  created_time: string
  updated_time: string
  questions?: SurveyQuestion[]
}

export interface SurveyCreateData {
  id?: number
  title: string
  description?: string
  category: number
  status?: number
  start_time?: string
  end_time?: string
  is_anonymous?: number
  max_submissions?: number
  questions?: SurveyQuestion[]
}

export interface SurveyListRequestParams {
  keyword?: string
  category?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface BatchDeleteRequestParams {
  ids: number[]
}

export interface SurveyListResponseData {
  code: number
  message: string
  data: {
    surveys: SurveyListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface SurveyDetailResponseData {
  code: number
  message: string
  data: SurveyListData
}

export interface SurveyActionResponseData {
  code: number
  message: string
}

export interface SurveySubmissionData {
  id: number
  survey_id: number
  user_id: number | null
  user_name: string | null
  submission_data: any
  submit_time: string
  ip_address: string | null
}

export interface SurveySubmissionListResponseData {
  code: number
  message: string
  data: {
    submissions: SurveySubmissionData[]
    total: number
    page: number
    pageSize: number
  }
}
