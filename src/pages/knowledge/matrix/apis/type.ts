export interface MatrixListData {
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

export interface MatrixCreateData {
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

export interface MatrixListRequestParams {
  keyword?: string
  format?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface MatrixStaffListRequestParams {
  keyword?: string
  type?: string
  id: string
}

export interface BatchDeleteRequestParams {
  ids: number[]
}

export interface MatrixListResponseData {
  code: number
  message: string
  data: {
    matrixs: MatrixListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface MatrixStaffListResponseData {
  code: number
  message: string
  data: {
    users: StaffListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface MatrixDetailResponseData {
  code: number
  message: string
  data: MatrixListData
}

export interface MatrixActionResponseData {
  code: number
  message: string
}
