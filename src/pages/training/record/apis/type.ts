export interface RecordListData {
  id: number
  name: string
  training_scope: string[]
  trainer: string | null
  training_mode: number
  training_category: number
  planned_participants: number
  planned_time: string
  training_hours: number
  assessment_method: number
  exam_method: number
  status: number
  created_time: string
  updated_time: string
}

export interface StaffListData {
  id: number
  name: string
  type: number
}

export interface RecordCreateData {
  id?: number
  name: string
  training_scope: string[]
  trainer: string | null
  training_mode: number
  training_category: number
  planned_participants: number
  planned_time: string
  training_hours: number
  assessment_method: number
  exam_method: number
}

export interface RecordListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface RecordStaffListRequestParams {
  keyword?: string
  type?: string
  id: string
}

export interface BatchDeleteRequestParams {
  ids: number[]
}

export interface RecordListResponseData {
  code: number
  message: string
  data: {
    plans: RecordListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface RecordStaffListResponseData {
  code: number
  message: string
  data: {
    users: StaffListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface RecordDetailResponseData {
  code: number
  message: string
  data: RecordListData
}

export interface RecordActionResponseData {
  code: number
  message: string
}
