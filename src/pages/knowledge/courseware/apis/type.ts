export interface CoursewareListData {
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

export interface CoursewareCreateData {
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

export interface CoursewareListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface CoursewareStaffListRequestParams {
  keyword?: string
  type?: string
  id: string
}

export interface BatchDeleteRequestParams {
  ids: number[]
}

export interface CoursewareListResponseData {
  code: number
  message: string
  data: {
    coursewares: CoursewareListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CoursewareStaffListResponseData {
  code: number
  message: string
  data: {
    users: StaffListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CoursewareDetailResponseData {
  code: number
  message: string
  data: CoursewareListData
}

export interface CoursewareActionResponseData {
  code: number
  message: string
}
