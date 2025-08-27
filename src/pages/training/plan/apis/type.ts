export interface Trainer {
  id: number
  name: string
}

export interface PlanListData {
  id: number
  name: string
  training_scope: string[]
  trainer: Trainer
  training_mode: number
  training_category: number
  planned_participants: number
  planned_time: string
  planned_end_time: string
  training_hours: number
  assessment_method: number
  exam_method: number
  status: number
  created_time: string
  updated_time: string
  objectives: string
  description: string
}

export interface PlanCreateData {
  id?: number
  name: string
  training_scope: string[]
  trainer: string | null
  training_mode: number
  training_category: number
  planned_participants: number
  planned_time: string
  planned_end_time: string
  training_hours: number
  assessment_method: number
  exam_method: number
  objectives: string
  description: string
}

export interface PlanListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface BatchDeleteRequestParams {
  ids: number[]
}

export interface PlanListResponseData {
  code: number
  message: string
  data: {
    plans: PlanListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface PlanDetailResponseData {
  code: number
  message: string
  data: PlanListData
}

export interface PlanActionResponseData {
  code: number
  message: string
}
