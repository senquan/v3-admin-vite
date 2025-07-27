import { request } from "@/http/axios"

// 培训计划接口
export interface TrainingPlan {
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

// 培训记录接口
export interface TrainingRecord {
  id: number
  training_plan_id: number
  participants: number[]
  participants_outer: number[]
  contents: string
  contents_select: UploadFile[]
  contents_matrix: number[]
  coursewares: number[]
  status: number
  created_time: string
  updated_time: string
  trainingPlanEntity?: TrainingPlan
  participantEntities?: User[]
  coursewareEntities?: Courseware[]
}

// 用户接口
export interface User {
  id: number
  name: string
  realname?: string
  email?: string
  phone?: string
  branch?: {
    name: string
  }
  joinDate?: string
  gender?: string
  oa_id?: string
  age?: number
  married?: boolean
}

// 课件接口
export interface Courseware {
  id: number
  title: string
  description?: string
  file_path: string
  file_type: string
  file_size: number
  category_id: number
  status: boolean
  creator: number
  create_time: string
}

// 上传文件接口
export interface UploadFile {
  url: string
  name: string
}

// 我的培训列表查询参数
export interface MyTrainingListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number
  training_category?: number
  start_date?: string
  end_date?: string
}

// 我的培训列表响应
export interface MyTrainingListResponse {
  code: number
  message: string
  data: {
    records: TrainingRecord[]
    total: number
    page: number
    pageSize: number
  }
}

// 培训详情响应
export interface TrainingDetailResponse {
  code: number
  message: string
  data: {
    record: TrainingRecord
  }
}

// 培训统计接口
export interface TrainingStats {
  totalTrainings: number
  completedTrainings: number
  totalHours: number
  passedExams: number
  averageScore: number
  recentTrainings: TrainingRecord[]
  certificateCount: number
}

export interface MyTask {
  id: number
  type: number
  title: string
  description: string | null
  trainer: string
  progress: number
  duration: number
  result: boolean
  assessmentMethod: number
}

export interface MyCertificate {
  id: number
  type: number
  title: string
  awardTime: string
}

// 培训统计响应
export interface TrainingStatsResponse {
  code: number
  message: string
  data: {
    stats: TrainingStats
    profile: User
    tasks: MyTask[]
    certificates: MyCertificate[]
  }
}

// 获取我的培训列表
export function getMyTrainingList(params: MyTrainingListParams) {
  return request<MyTrainingListResponse>({
    url: "record/my-trainings",
    method: "get",
    params
  })
}

// 获取培训详情
export function getTrainingDetail(id: number) {
  return request<TrainingDetailResponse>({
    url: `record/${id}`,
    method: "get"
  })
}

// 获取培训统计
export function getTrainingStats() {
  return request<TrainingStatsResponse>({
    url: "record/my-stats",
    method: "get"
  })
}

// 标记培训完成
export function markTrainingComplete(recordId: number) {
  return request<{ code: number, message: string, data: any }>({
    url: `record/${recordId}/complete`,
    method: "post"
  })
}

// 获取培训课件
export function getTrainingCoursewares(recordId: number) {
  return request<{ code: number, message: string, data: { coursewares: Courseware[] } }>({
    url: `record/${recordId}/coursewares`,
    method: "get"
  })
}
